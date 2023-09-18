import axios from "axios";
import sharp from "sharp";

export async function watermark({
  pluginInvocationToken,
  assets,
  callbackUrl,
}) {
  console.log(
    "rotate",
    pluginInvocationToken,
    JSON.stringify(assets),
    callbackUrl
  );

  const inputAsset = assets[0];

  // TODO: consider using https://github.com/sindresorhus/got, it has a simpler syntax:
  // const imageBuffer = await got(url).buffer();
  const inputImageBuffer = (
    await axios({
      url: inputAsset.url,
      responseType: "arraybuffer",
    })
  ).data;

  const { width, height } = await sharp(inputImageBuffer).metadata();
  console.log("loaded input asset");
  const text = "PlayBook";
  const svgImage = `
    <svg width="${width}" height="${height}">
      <style>
        .title { fill: #fff; font-size: ${Math.min(
          width / 10,
          height / 10
        )}px; font-weight: bold; color: #fff; opacity: 0.8;}
      </style>
      <text x="50%" y="50%" text-anchor="middle" class="title">${text}</text>
    </svg>
    `;
  const svgBuffer = Buffer.from(svgImage);

  // const outputImageBuffer = await sharp(inputImageBuffer).rotate(90).toBuffer();
  // const outputImageBuffer = await sharp(inputImageBuffer).modulate({ brightness: 1.2, contrast: 1.2, saturation: 1.2 }).toBuffer();
  const outputImageBuffer = await sharp(inputImageBuffer)
    .flatten({ background: { r: 255, g: 255, b: 255, alpha: 0.5 } })
    .composite([
      {
        input: svgBuffer, // Convert watermark text to a buffer
        gravity: "southeast",
        tile: false,
      },
    ])
    .toBuffer();

  console.log("processed with sharp");

  // Create a placeholder asset to upload the result to
  const createdAssets = (
    await axios({
      method: "post",
      url: callbackUrl,
      data: {
        pluginInvocationToken,
        operation: "createAssets",
        assets: [
          {
            title: `${inputAsset.title} - rotated`,
            group: inputAsset.token,
          },
        ],
      },
    })
  ).data.assets;

  console.log("created assets", JSON.stringify(createdAssets));

  await axios({
    method: "put",
    headers: { "Content-Type": "image/png" },
    url: createdAssets[0].uploadUrl,
    data: outputImageBuffer,
  });

  console.log("uploaded output asset");

  await axios({
    method: "post",
    url: callbackUrl,
    data: {
      pluginInvocationToken,
      status: "success",
    },
  });

  console.log("done");
}

async function normalise({ pluginInvocationToken, assets, callbackUrl }) {
  console.log(
    "normalise",
    pluginInvocationToken,
    JSON.stringify(assets),
    callbackUrl
  );

  const inputAsset = assets[0];

  // TODO: consider using
  // const imageBuffer = await got(url).buffer();
  const inputImageBuffer = (
    await axios({
      url: inputAsset.url,
      responseType: "arraybuffer",
    })
  ).data;

  const outputImageBuffer = await sharp(inputImageBuffer)
    .normalise()
    .toBuffer();

  console.log("processed with sharp");

  // Create a placeholder asset to upload the result to
  const createdAssets = (
    await axios({
      method: "post",
      url: callbackUrl,
      data: {
        pluginInvocationToken,
        operation: "createAssets",
        assets: [
          {
            title: `${inputAsset.title} - normalised`,
            group: inputAsset.token,
          },
        ],
      },
    })
  ).data.assets;

  console.log("created assets", JSON.stringify(createdAssets));

  await axios({
    method: "put",
    headers: { "Content-Type": "image/png" },
    url: createdAssets[0].uploadUrl,
    data: outputImageBuffer,
  });

  console.log("uploaded output asset");

  await axios({
    method: "post",
    url: callbackUrl,
    data: {
      pluginInvocationToken,
      status: "success",
    },
  });

  console.log("done");
}
