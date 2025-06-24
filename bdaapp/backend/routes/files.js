const express = require("express");
const router = express.Router();
const File = require("../models/FileOrFolder");


const TEST_USER_ID = "664cbcb179d06cdbb1d53e5f";

router.post("/", async (req, res) => {
  try {
    const { name, type, content = "", tags = [] } = req.body;

    if (!name || !type) {
      return res.status(400).json({ message: "Name and type are required" });
    }

    if (type === "file") {
      if (content.length > 10240) {
        return res.status(400).json({ message: "File content exceeds 10KiB limit" });
      }
      if (tags.length > 5) {
        return res.status(400).json({ message: "Maximum 5 tags allowed" });
      }
    }

    const newFile = new File({
      name,
      type,
      content: type === "file" ? content : undefined,
      tags: type === "file" ? tags.map(t => t.toLowerCase()) : [],
      owner: TEST_USER_ID,
    });

    await newFile.save();
    console.log("File saved:", newFile);
    res.status(201).json(newFile);

  } catch (err) {
    console.error("File creation error:", err);
    res.status(500).json({ error: err.message });
  }
});

router.get("/", async (req, res) => {
  const files = await File.find();
  console.log("Files fetched:", files.length);
  res.json(files);
});



router.get("/", async (req, res) => {
  const { sort = "name" } = req.query;

  const validSorts = ["name", "createdAt", "modifiedAt", "size"];
  const sortKey = validSorts.includes(sort) ? sort : "name";

  try {
    const files = await File.find().sort({ [sortKey]: 1 });
    res.json(files);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


module.exports = router;
