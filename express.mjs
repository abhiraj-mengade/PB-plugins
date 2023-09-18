import express from "express";
import watermark from "./src/plugin.mjs";

// TODO: investigate if we can enable `debugger`

// TODO: would be SICK if there was a "rerun last request" button. Not hard to implement

const port = 3000;
const app = express();
app.use(express.json());

app.get("/", async (req, res) => {
  console.log("Received GET");
  console.log(req.body);
  res.send("Hello World! Use POST to trigger the plugin in development.");
});

app.post("/", async (req, res) => {
  console.log("Received POST");
  const { pluginInvocationToken, assets, callbackUrl } = req.body;
  res.sendStatus(200);

  await watermark({ pluginInvocationToken, assets, callbackUrl });
});

app.post("/normalise", async (req, res) => {
  console.log("Received POST");
  const { pluginInvocationToken, assets, callbackUrl } = req.body;
  res.sendStatus(200);

  await normalise({ pluginInvocationToken, assets, callbackUrl });
});

app.listen(port, () => {
  console.log(
    `\nPlugin listening on port ${port}.\nUse \`ngrok http ${port}\` to expose this port to the internet for development.`
  );
});
