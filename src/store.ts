import * as fs from "fs";
import * as path from "path";
import { app } from "electron";

export class WidgetStore {
  filePath: string;
  constructor() {
    const userData = (app && app.getPath) ? app.getPath("userData") : process.cwd();
    this.filePath = path.join(userData, "widgets.json");
    if (!fs.existsSync(this.filePath)) {
      fs.writeFileSync(this.filePath, "[]", "utf-8");
    }
  }

  getAll() {
    try {
      const raw = fs.readFileSync(this.filePath, "utf-8");
      return JSON.parse(raw);
    } catch (err) {
      return [];
    }
  }

  save(conf: any) {
    const all = this.getAll();
    // replace if id exists
    if (conf.id) {
      const idx = all.findIndex((c: any) => c.id === conf.id);
      if (idx >= 0) {
        all[idx] = conf;
      } else {
        all.push(conf);
      }
    } else {
      conf.id = Date.now();
      all.push(conf);
    }
    fs.writeFileSync(this.filePath, JSON.stringify(all, null, 2), "utf-8");
    return true;
  }
}