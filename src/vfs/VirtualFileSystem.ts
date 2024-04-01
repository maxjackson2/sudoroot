import memfs from "memfs";
import fs, { mkdirSync } from "fs";
import $P from "path/posix";
import path from "path";

export class VirtualFileSystem {

    private fs: memfs.IFs = memfs.fs;
    private directories: string[] = [
        "/sudoroot",
        "/sudoroot/sys",
        "/sudoroot/lib",
        "/sudoapps",
        "{MainUser}",
        "{MainUser}/Downloads",
        "{MainUser}/Desktop",
        "{MainUser}/apps",
    ]
    private currentWorkingDirectory = "/";

    getFS() {
        return this.fs;
    }

    cwd(): string;
    cwd(cwd: string): string;
    cwd(cwd?: string): string {
        if (cwd) {
            this.currentWorkingDirectory = cwd;
        }
        return this.currentWorkingDirectory;
    }

    resolve(path: string) {
        let pt = path;
        let i: string = "";
        if (pt === this.cwd()) return path;
        
        if (!pt.startsWith(`/`) && !pt.startsWith(`./`)) {
            if (this.cwd() === "/") {
                i = `/${pt}`;
            } else {
                i = `${this.cwd()}/${pt}`;
            }
        } else {
            i = pt;
        }

        return $P.resolve(i);
    }
    
    createDefaultDirectories() {
        
        for (let dir of this.directories) {
            if (dir.includes("{MainUser}")) dir = dir.replaceAll("{MainUser}", "/sudousers/MainUser/");
            this.getFS().mkdirSync(dir, {
                recursive: true
            });
        }

        this.copyfromto();

    }

    copyfromto() {

        const func = (dir: string) => {
            let nvm = dir.replaceAll("vm", "");
            fs.readdirSync(dir).forEach((v) => {
                if (fs.statSync(path.join(dir, v)).isFile()) {
                    const data = fs.readFileSync(path.join(dir, v));
                    this.getFS().mkdirSync($P.join(nvm), { recursive: true })
                    this.getFS().writeFileSync($P.join(nvm, v), data);
                } else {
                    func(path.join(dir, v));
                }
            });
        }

        func("vm");

    }
}