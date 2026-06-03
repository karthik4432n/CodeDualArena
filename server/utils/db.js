const mongoose = require("mongoose");
const mockMongoose = require("./mockMongoose");

let useMock = false;
const compiledModels = {};

const db = {
  Schema: mongoose.Schema,
  
  // Connect method: checks MongoDB connection. Falls back to mock on failure.
  connect: async (uri) => {
    try {
      console.log(`Connecting to MongoDB at ${uri}...`);
      // Use a short selection timeout so it falls back quickly in development if mongo is down
      await mongoose.connect(uri, { serverSelectionTimeoutMS: 2000 });
      console.log("Connected to MongoDB successfully!");
      useMock = false;
    } catch (err) {
      console.error("MongoDB Connection Error details:", err);
      console.warn("MongoDB connection failed! Falling back to local JSON database.");
      useMock = true;
      await mockMongoose.connect();
    }
  },

  // Model registration and lookup proxy
  model: (name, schema) => {
    // Compile models on both drivers
    const realModel = mongoose.model(name, schema);
    const mockModel = mockMongoose.createModel(name);

    compiledModels[name] = { realModel, mockModel };

    // Return a Proxy that intercepts all static calls and forwards them to the active model
    const handler = {
      get: (target, prop) => {
        const activeModel = useMock ? compiledModels[name].mockModel : compiledModels[name].realModel;
        const val = activeModel[prop];
        if (typeof val === "function") {
          return val.bind(activeModel);
        }
        return val;
      },
      construct: (target, args) => {
        const activeModel = useMock ? compiledModels[name].mockModel : compiledModels[name].realModel;
        return new activeModel(...args);
      }
    };

    return new Proxy(realModel, handler);
  }
};

module.exports = db;
