import {rarityChecker} from "../src";
import * as fs from "fs";
import * as path from "path";
import "ts-mocha";
import * as mocha from "mocha";
import {expect} from "chai";
import * as assert from "assert";

mocha.describe("Rarity Tests", () => {
  // Prepare the rarity Checker using the metadata folder.
  console.log("Preparing the rarity checker object instance.");
  const metadataPath = path.join(__dirname, "metadata");
  const metadata = fs.readdirSync(metadataPath, "utf8");

  // Read files content and store in array.
  const metadataContent = metadata.map((file) => {
    return JSON.parse(fs.readFileSync(path.join(metadataPath, file), "utf8"));
  });

  mocha.describe("Prepare Rarity Checker", function () {
    it("Rarity Checker Ready", async function () {
      // Prepare the rarity Checker
      return await rarityChecker.init();
    });

    it("Can compute all rarities", async function () {
      // Prepare
      return await rarityChecker.getAllRarities(metadataContent, "edition");
    });
  });

  mocha.describe("Rarity Checker Behaviour", function () {
    mocha.it("Rarity order as expected", function () {
      // Log the first 10 tokens
      return rarityChecker
        .getAllRarities(metadataContent, "edition")
        .then((rarities) => {
          const expectedOrder = [1, 61, 10, 90, 6, 29, 17, 12, 99, 87];
          return assert.deepEqual(
            rarities.slice(0, 10).map((token) => token.tokenID),
            expectedOrder
          );
        });
    });

    mocha.it("Rarity of token 1 should be 1", function (done) {
      const rarityToken1 = rarityChecker.getSingleRarity(1);
      expect(rarityToken1.rank).to.equal(1);
      done();
    })
  });
});
