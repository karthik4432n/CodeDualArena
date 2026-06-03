const fs = require("fs");
const path = require("path");
const bcrypt = require("bcryptjs");

const DB_PATH = path.join(__dirname, "..", "data", "db.json");

// Ensure data folder and file exists
function initFileDb() {
  const dir = path.dirname(DB_PATH);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  if (!fs.existsSync(DB_PATH)) {
    fs.writeFileSync(DB_PATH, JSON.stringify({ users: [], problems: [], matches: [] }, null, 2));
  }
}

function readDb() {
  initFileDb();
  try {
    const data = fs.readFileSync(DB_PATH, "utf8");
    return JSON.parse(data);
  } catch (err) {
    return { users: [], problems: [], matches: [] };
  }
}

function writeDb(data) {
  initFileDb();
  fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));
}

// Generate unique string ID mimicking MongoDB ObjectId
function generateId() {
  return Math.random().toString(16).substr(2, 24).padEnd(24, "0");
}

class Query {
  constructor(promise) {
    this.promise = promise;
    this._selectFields = null;
    this._limitVal = null;
    this._sortFields = null;
    this._populateFields = [];
  }

  select(fields) {
    this._selectFields = fields;
    return this;
  }

  sort(fields) {
    this._sortFields = fields;
    return this;
  }

  limit(n) {
    this._limitVal = n;
    return this;
  }

  populate(fields) {
    if (typeof fields === "string") {
      this._populateFields.push(fields);
    }
    return this;
  }

  async exec() {
    let result = await this.promise;
    
    // Apply sorting
    if (this._sortFields && Array.isArray(result)) {
      let key = "";
      let order = 1;
      if (typeof this._sortFields === "string") {
        if (this._sortFields.startsWith("-")) {
          key = this._sortFields.substring(1);
          order = -1;
        } else {
          key = this._sortFields;
          order = 1;
        }
      } else if (typeof this._sortFields === "object") {
        key = Object.keys(this._sortFields)[0];
        order = this._sortFields[key];
      }

      if (key) {
        result.sort((a, b) => {
          if (a[key] < b[key]) return -1 * order;
          if (a[key] > b[key]) return 1 * order;
          return 0;
        });
      }
    }

    // Apply limit
    if (this._limitVal !== null && Array.isArray(result)) {
      result = result.slice(0, this._limitVal);
    }

    // Apply populate
    if (this._populateFields.length > 0 && Array.isArray(result)) {
      const db = readDb();
      result = result.map(doc => this._populateDoc(doc, db));
    } else if (this._populateFields.length > 0 && result) {
      const db = readDb();
      result = this._populateDoc(result, db);
    }

    // Apply select/projection
    if (this._selectFields && result) {
      const fields = typeof this._selectFields === "string" 
        ? this._selectFields.split(" ") 
        : Object.keys(this._selectFields);
      
      const exclude = fields.some(f => f.startsWith("-"));
      
      const applySelect = (doc) => {
        const cleaned = { ...doc };
        if (exclude) {
          fields.forEach(f => {
            const cleanF = f.replace("-", "");
            delete cleaned[cleanF];
          });
        } else {
          const projected = {};
          // Always keep ID
          projected._id = doc._id;
          projected.id = doc.id;
          fields.forEach(f => {
            if (f.trim()) projected[f.trim()] = doc[f.trim()];
          });
          return projected;
        }
        return cleaned;
      };

      if (Array.isArray(result)) {
        result = result.map(applySelect);
      } else {
        result = applySelect(result);
      }
    }

    return result;
  }

  _populateDoc(doc, db) {
    const populated = { ...doc };
    this._populateFields.forEach(field => {
      // Handle player1, player2, problem, winner
      if (field === "player1" || field === "player2" || field === "winner") {
        const id = doc[field];
        if (id) {
          const user = db.users.find(u => u._id === id.toString() || u.id === id.toString());
          if (user) {
            populated[field] = {
              _id: user._id,
              id: user._id,
              username: user.username,
              elo: user.elo
            };
          }
        }
      }
      if (field === "problem") {
        const id = doc[field];
        if (id) {
          const problem = db.problems.find(p => p._id === id.toString() || p.id === id.toString());
          if (problem) {
            populated[field] = {
              _id: problem._id,
              id: problem._id,
              title: problem.title,
              difficulty: problem.difficulty
            };
          }
        }
      }
      if (field === "solvedProblems") {
        const ids = doc[field] || [];
        populated[field] = ids.map(id => {
          const problem = db.problems.find(p => p._id === id.toString() || p.id === id.toString());
          return problem ? { _id: problem._id, id: problem._id, title: problem.title, difficulty: problem.difficulty } : id;
        });
      }
    });
    return populated;
  }

  // Thenable interface so we can use await directly on Model calls
  then(onFulfilled, onRejected) {
    return this.exec().then(onFulfilled, onRejected);
  }

  catch(onRejected) {
    return this.exec().catch(onRejected);
  }
}

function createModel(modelName) {
  let collectionName = modelName.toLowerCase() + "s";
  if (modelName.toLowerCase() === "match") {
    collectionName = "matches";
  }

  const defaults = {};
  if (modelName === "User") {
    Object.assign(defaults, {
      elo: 1000,
      winStreak: 0,
      maxWinStreak: 0,
      totalMatches: 0,
      wins: 0,
      losses: 0,
      solvedProblems: []
    });
  } else if (modelName === "Match") {
    Object.assign(defaults, {
      status: "pending",
      player1Score: 0,
      player2Score: 0,
      player1PassedCases: 0,
      player2PassedCases: 0,
      duration: 0
    });
  }

  class MockModel {
    constructor(data) {
      Object.assign(this, defaults, data);
      if (!this._id) {
        this._id = generateId();
      }
      this.id = this._id;
    }

    async save() {
      const db = readDb();
      const collection = db[collectionName];

      // Password hashing middleware simulate for User
      if (modelName === "User" && this.password && !this.password.startsWith("$2a$")) {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
      }

      const existingIndex = collection.findIndex(item => item._id === this._id);
      
      const plainObject = JSON.parse(JSON.stringify(this));

      if (existingIndex !== -1) {
        collection[existingIndex] = plainObject;
      } else {
        collection.push(plainObject);
      }

      db[collectionName] = collection;
      writeDb(db);
      return this;
    }

    // Instance method for password compare
    async comparePassword(candidatePassword) {
      return await bcrypt.compare(candidatePassword, this.password);
    }

    static find(query = {}) {
      const promise = (async () => {
        const db = readDb();
        let items = db[collectionName];

        // Apply query filters
        if (Object.keys(query).length > 0) {
          items = items.filter(item => {
            return Object.entries(query).every(([key, val]) => {
              if (key === "$or") {
                return val.some(orQuery => {
                  return Object.entries(orQuery).every(([orK, orV]) => item[orK] === orV);
                });
              }
              // Simple matching
              return item[key] === val;
            });
          });
        }

        // Return instances
        return items.map(item => new MockModel(item));
      })();

      return new Query(promise);
    }

    static findOne(query = {}) {
      const promise = (async () => {
        const db = readDb();
        const items = db[collectionName];

        const item = items.find(item => {
          return Object.entries(query).every(([key, val]) => {
            if (key === "$or") {
              return val.some(orQuery => {
                return Object.entries(orQuery).every(([orK, orV]) => {
                  const itemVal = item[orK];
                  const matchVal = orV;
                  return itemVal && matchVal && itemVal.toLowerCase() === matchVal.toLowerCase();
                });
              });
            }
            if (typeof val === "string" && typeof item[key] === "string") {
              return item[key].toLowerCase() === val.toLowerCase();
            }
            return item[key] === val;
          });
        });

        return item ? new MockModel(item) : null;
      })();

      return new Query(promise);
    }

    static findById(id) {
      const promise = (async () => {
        const db = readDb();
        const items = db[collectionName];
        const item = items.find(item => item._id === id.toString() || item.id === id.toString());
        return item ? new MockModel(item) : null;
      })();

      return new Query(promise);
    }

    static async countDocuments(query = {}) {
      const items = await this.find(query);
      return items.length;
    }

    static async insertMany(docs) {
      const db = readDb();
      const collection = db[collectionName];
      const inserted = [];

      for (let doc of docs) {
        const modelInst = new MockModel(doc);
        
        // Password hashing
        if (modelName === "User" && modelInst.password && !modelInst.password.startsWith("$2a$")) {
          const salt = await bcrypt.genSalt(10);
          modelInst.password = await bcrypt.hash(modelInst.password, salt);
        }

        const plainObject = JSON.parse(JSON.stringify(modelInst));
        collection.push(plainObject);
        inserted.push(modelInst);
      }

      db[collectionName] = collection;
      writeDb(db);
      return inserted;
    }

    static async aggregate(pipeline = []) {
      // Basic mock implementation for leaderboard and stats
      const db = readDb();
      const items = db[collectionName];

      // Handle simple Group Elo Average
      if (pipeline.some(p => p.$group && p.$group.avgElo)) {
        if (items.length === 0) return [];
        const sum = items.reduce((acc, curr) => acc + (curr.elo || 1000), 0);
        return [{ _id: null, avgElo: sum / items.length }];
      }

      return items;
    }
  }

  return MockModel;
}

module.exports = {
  connect: async () => {
    initFileDb();
    console.log("Mock Database initialized successfully at " + DB_PATH);
  },
  createModel
};
