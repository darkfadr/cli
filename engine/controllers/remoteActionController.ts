import { debug, trace, ExecutionConfig, UserDataStorage, UserLoginData } from "../../common";
import { getCliConnector, getCloudConnector } from "../../engine";
import { ICliConnector } from "../../interfaces";
import * as path from "path";
import _ = require("lodash");
import * as uuid from "uuid";

/**
 * class implement scope of remote cli graphql actions.
 * deploy:
 *  1. get url and token for upload to aws
 *  2. upload to aws. receive guid of uploaded build,
 *  3. send command to remote cli point deploy uploaded schema.
 *
 * autorizate
 *  At moment implementation is developed for tests.
 *  For the future: we have to login through frontend (like graphcool)
 *  1. send to the server command with generated guid that some user is going to login
 *  2. open browser with generated guid
 *  3. user login
 *  4. ask the server login status. (use generated guid in first section)
 */

export class RemoteActionController {

    static async deploy(archiveBuildPath: string, archiveSummaryPath: string, build: string) {
        await this.remoteActionWrap(
            _.bind(RemoteActionController.deployInternal, this, archiveBuildPath, archiveSummaryPath, build));
    }

    static async autorizate(email?: string, password?: string): Promise<UserLoginData> {

        let data = UserDataStorage.getData();

        // check jwt token

        if (data) {
            trace("You are already logged into 8base account. To clear auth data use \"8base clear\"");
            return data;
        }

        const session = uuid.v4();
        const resp = await getCliConnector().login(session, email, password);

        // TODO open browser and login from it
        if (!resp.success) {
            throw new Error("login error = " + resp.message);
        }

        debug("login success, try to get token data");

        const loginData = await this.waitForUserLogin(session);

        debug("save token...");

        UserDataStorage.saveAuth(loginData);

        return loginData;
    }


    /*
        Private functions
    */


    private static async reauth() {

    }

    private static async remoteActionWrap(action: any) {
        try {
            action();
        } catch(ex) {
            // if ex is auth error
            this.reauth();
            action();
        }
    }

    private static async deployInternal(archiveBuildPath: string, archiveSummaryPath: string, build: string) {
        const cliConnector = getCliConnector();

        const urls = await cliConnector.getDeployUrl(build);

        const cloudConnector = getCloudConnector();
        await cloudConnector.upload(urls.buildUrl, archiveBuildPath);
        await cloudConnector.upload(urls.summaryDataUrl, archiveSummaryPath);

        const result = await cliConnector.deployShema(build);

        if (!result.success) {
            throw new Error(result.message);
        }
    }

    private static async waitForUserLogin(session: string): Promise<UserLoginData> {
        let complete = false;
        const cliConnector = getCliConnector();
        let res: any;
        let counter = 100;
        while(!complete && --counter >= 0) {
            res = await cliConnector.getUserLoginToken(session);
            complete = res.success;
        }

        if (counter < 0) {
            throw new Error("Max retry count reached!");
        }
        return res;
    }
}