const fs = require("fs");
const path = require("path");

const fontsDir = "C:\\Users\\vaibh\\Ubuntu\\Veloce\\veloce\\assets\\fonts";
const templatePath = process.argv[2];
const outPath = process.argv[3];

const FONTS = [
  { family: "VelOrbitron", file: "Orbitron-Bold.ttf", weight: 700 },
  { family: "VelJakarta", file: "PlusJakartaSans-Regular.ttf", weight: 400 },
  { family: "VelJakartaMd", file: "PlusJakartaSans-Medium.ttf", weight: 500 },
  { family: "VelJakartaSB", file: "PlusJakartaSans-SemiBold.ttf", weight: 600 },
  { family: "VelJakartaXB", file: "PlusJakartaSans-ExtraBold.ttf", weight: 800 },
  { family: "VelJakartaIt", file: "PlusJakartaSans-Italic.ttf", weight: 400, style: "italic" },
];

let faces = "";
for (const f of FONTS) {
  const buf = fs.readFileSync(path.join(fontsDir, f.file));
  const b64 = buf.toString("base64");
  faces += `@font-face{font-family:"${f.family}";src:url(data:font/ttf;base64,${b64}) format("truetype");font-weight:${f.weight};font-style:${f.style || "normal"};font-display:swap;}\n`;
}

const template = fs.readFileSync(templatePath, "utf8");
const out = template.split("/*@FONT_FACES@*/").join(faces);
fs.writeFileSync(outPath, out, "utf8");
console.log("Written", outPath, out.length, "bytes");
