const { exec } = require("child_process");
const fs = require("fs");
const path = require("path");

// Test Ghostscript detection
async function testGhostscriptDetection() {
  console.log("🔍 Testing Ghostscript detection...");

  return new Promise((resolve) => {
    exec("gs --version", (error, stdout, stderr) => {
      if (!error) {
        console.log('✅ Ghostscript found via "gs" command:', stdout.trim());
        resolve(true);
        return;
      }

      // Try common Windows Ghostscript paths
      const commonPaths = [
        "C:\\Program Files\\gs\\gs10.00.0\\bin\\gswin64c.exe",
        "C:\\Program Files\\gs\\gs10.00.0\\bin\\gswin32c.exe",
        "C:\\Program Files (x86)\\gs\\gs10.00.0\\bin\\gswin32c.exe",
        "C:\\Program Files\\gs\\gs9.56.1\\bin\\gswin64c.exe",
        "C:\\Program Files\\gs\\gs9.56.1\\bin\\gswin32c.exe",
        "C:\\Program Files (x86)\\gs\\gs9.56.1\\bin\\gswin32c.exe",
      ];

      for (const gsPath of commonPaths) {
        if (fs.existsSync(gsPath)) {
          exec(`"${gsPath}" --version`, (error, stdout, stderr) => {
            if (!error) {
              console.log("✅ Ghostscript found at:", gsPath);
              console.log("Version:", stdout.trim());
              resolve(true);
              return;
            }
          });
        }
      }

      console.log("❌ Ghostscript not found");
      resolve(false);
    });
  });
}

// Test if we can download Ghostscript
async function testGhostscriptDownload() {
  console.log("\n📥 Testing Ghostscript download capability...");

  const https = require("https");
  const is64Bit = process.arch === "x64";
  const url = is64Bit
    ? "https://github.com/ArtifexSoftware/ghostpdl-downloads/releases/download/gs1000/gs1000w64.exe"
    : "https://github.com/ArtifexSoftware/ghostpdl-downloads/releases/download/gs1000/gs1000w32.exe";

  console.log("Architecture:", process.arch);
  console.log("Download URL:", url);

  return new Promise((resolve) => {
    const makeRequest = (url) => {
      https
        .get(url, (response) => {
          // Handle redirects
          if (response.statusCode === 301 || response.statusCode === 302) {
            const newUrl = response.headers.location;
            console.log(`Redirecting to: ${newUrl}`);
            makeRequest(newUrl);
            return;
          }

          if (response.statusCode === 200) {
            console.log("✅ Download URL is accessible");
            console.log(
              "Content-Length:",
              response.headers["content-length"],
              "bytes"
            );
            resolve(true);
          } else {
            console.log("❌ Download failed with status:", response.statusCode);
            resolve(false);
          }
        })
        .on("error", (error) => {
          console.log("❌ Download error:", error.message);
          resolve(false);
        });
    };

    makeRequest(url);
  });
}

// Main test function
async function runTests() {
  console.log("🧪 Running Ghostscript installation tests...\n");

  const isDetected = await testGhostscriptDetection();
  const canDownload = await testGhostscriptDownload();

  console.log("\n📊 Test Results:");
  console.log("Ghostscript Detection:", isDetected ? "✅ PASS" : "❌ FAIL");
  console.log("Download Capability:", canDownload ? "✅ PASS" : "❌ FAIL");

  if (!isDetected && canDownload) {
    console.log(
      "\n💡 Recommendation: Ghostscript is not installed but can be downloaded."
    );
    console.log("   The app should prompt users to install it automatically.");
  } else if (!isDetected && !canDownload) {
    console.log(
      "\n⚠️  Warning: Ghostscript is not installed and download test failed."
    );
    console.log("   Users may need to manually install Ghostscript.");
  } else if (isDetected) {
    console.log("\n✅ Ghostscript is properly installed and working.");
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  runTests().catch(console.error);
}

module.exports = { testGhostscriptDetection, testGhostscriptDownload };
