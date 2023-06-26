import { loadPyodide, PyodideInterface } from "pyodide";
import { generateCode } from "./rarityCode";

enum ERROR_CODES {
  MICROPIP_LOAD_FAILED = "PYODIDE_LOAD_FAILED",
  PACKAGE_LOAD_FAILED = "PACKAGE_LOAD_FAILED",
  RARITY_COMPUTATION_FAILED = "RARITY_COMPUTATION_FAILED",
}

class OpenRarityTsError extends Error {
  code: ERROR_CODES;

  constructor(code: ERROR_CODES, message: string) {
    super(message);
    this.code = code;
  }
}

class Pyodide {
  private pyodide: PyodideInterface;
  private micropip: any;
  async init() {
    this.pyodide = await loadPyodide();
  }

  async getPyodide(): Promise<PyodideInterface> {
    try {
      if (!this.pyodide) {
        await this.init();
      }
      return this.pyodide;
    } catch (e) {
      throw new OpenRarityTsError(
        ERROR_CODES.MICROPIP_LOAD_FAILED,
        `Failed to load pyodide : ${e.message}}`
      );
    }
  }

  async loadPackage(packageName: string) {
    try {
      const pyodide = await this.getPyodide();
      return await pyodide.pyimport(packageName);
    } catch (e) {
      throw new OpenRarityTsError(
        ERROR_CODES.PACKAGE_LOAD_FAILED,
        `Failed to load package ${packageName} : ${e.message}}`
      );
    }
  }

  async installPackage(packageName: string) {
    if (!this.micropip) {
      const pyodide = await this.getPyodide();
      await pyodide.loadPackage("micropip");
      this.micropip = await this.loadPackage("micropip");
    }

    return this.micropip.install(packageName);
  }

  async runPython(code: string) {
    const pyodide = await this.getPyodide();
    return pyodide.runPython(code);
  }
}

enum RarityCheckerStatus {
  INIT = "INIT",
  READY = "READY",
  LOADING = "LOADING",
  ERROR = "ERROR",
}

export interface IRarityToken {
  tokenID: string;
  rank: number;
  score: number;
}

class RarityChecker {
  private status: RarityCheckerStatus;
  private pyodide: Pyodide;
  private rarities: IRarityToken[];
  constructor(pyodide: Pyodide) {
    this.pyodide = pyodide;
    this.status = RarityCheckerStatus.INIT;
  }

  async init() {
    if (this.status !== RarityCheckerStatus.INIT) {
      console.log("Rarity Checker already initialized");
      return;
    }

    this.status = RarityCheckerStatus.LOADING;
    await this.pyodide.installPackage("open-rarity");
    this.status = RarityCheckerStatus.READY;
  }

  async getAllRarities(
    tokens: any[],
    tokenIdentifierProperty: string = "tokenID"
  ): Promise<IRarityToken[]> {
    if (this.status !== RarityCheckerStatus.READY) {
      await this.init();
    }

    try {
      // We convert the tokens variable to python compatible format.
      const pyodide = await this.pyodide.getPyodide();
      const code = generateCode(
        JSON.stringify(tokens),
        tokenIdentifierProperty
      );
      const run = await pyodide.runPython(code);

      // We convert the result back to JS format.
      this.rarities = eval(run.toString());

      return this.rarities;
    } catch (e) {
      throw new OpenRarityTsError(
        ERROR_CODES.RARITY_COMPUTATION_FAILED,
        `Failed to compute rarity : ${e.message}}`
      );
    }
  }

  getSingleRarity(tokenId): IRarityToken {
    // Only callable after getAllRarities.
    if (!this.rarities) {
      throw new OpenRarityTsError(
        ERROR_CODES.RARITY_COMPUTATION_FAILED,
        `Rarities not computed yet, please call getAllRarities first.`
      );
    }

    return this.rarities.find((r) => r.tokenID === tokenId);
  }
}
const rarityChecker = new RarityChecker(new Pyodide());

export { rarityChecker };
