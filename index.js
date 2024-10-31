const { default: axios } = require("axios");
const express = require("express");
const redis = require("redis");

const redisUrl = "redis://127.0.0.1:6379";
const client = redis.createClient(redisUrl);

client.connect().catch(console.error);

client.on("connect", () => {
  console.log("Connected to Redis");
});

client.on("error", (err) => {
  console.error("Redis connection error:", err);
});

const port = 8080;
const app = express();
app.use(express.json());

app.post("/add", async (req, res) => {
  const { key, value } = req.body;
  const response = await client.set("key", "value", { key, value });
  res.json(response);
});

app.get("/:key", async (req, res) => {
  const { key } = req.params;
  const value = await client.get(key);
  res.json(value);
});

// json placeholder
app.get("/posts/:id", async (req, res) => {
  const { id } = req.params;
  const cachedPost = await client.get(`post:${id}`);

  if (cachedPost) {
    return res.json(JSON.parse(cachedPost));
  }

  const response = await axios.get(
    `https://jsonplaceholder.typicode.com/posts/${id}`
  );

  await client.set(`post:${id}`, JSON.stringify(response.data), {
    EX: 1,
  });

  return res.json(response.data);
});

app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`);
});
