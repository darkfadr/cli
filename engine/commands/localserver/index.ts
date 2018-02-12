import { BaseCommand } from "../base";
import { ExecutionConfig, debug, UserDataStorage, trace } from "../../../common";
import { InvalidArgument } from "../../../errors";
import { LocalServerExpress } from "./server";
import * as _ from "lodash";

export default class LocalServer extends BaseCommand {
    private port: string;

    private config: ExecutionConfig;

    private server: LocalServerExpress;

    async run(): Promise<any> {
        this.server.start();
    }

    async init(config: ExecutionConfig): Promise<any> {
        const port = config.getParameter("p") as number;
        if (!_.isNumber(port) || port < 1025) {
            throw new InvalidArgument("port");
        }

        this.server = new LocalServerExpress(port);
        this.config = config;
    }

    usage(): string {
        return "";
    }

    name(): string {
        return "local server";
    }

    onSuccess(): string {
        return "";
    }

}