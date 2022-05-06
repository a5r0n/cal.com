require("dotenv").config({ path: "../../../.env" });

const path = require("path");
const { defineConfig } = require("vite");
module.exports = defineConfig((configEnv) => {
  const config = {
    envPrefix: "NEXT_PUBLIC_",
    base: "/embed/",
    build: {
      minify: "terser",
      terserOptions: {
        format: {
          comments: false,
        },
      },
      rollupOptions: {
        input: {
          preview: path.resolve(__dirname, "preview.html"),
          embed: path.resolve(__dirname, "src/embed.ts"),
        },
        output: {
          entryFileNames: "[name].js",
          //FIXME: Can't specify UMD as import because preview is an app which doesn't support `format` and this setting apply to both input
          //format: "umd"
        },
      },
    },
  };

  if (configEnv.mode === "development") {
    config.build.watch = {
      include: ["src/**"],
    };
  }
  return config;
});
