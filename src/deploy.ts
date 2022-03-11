import axios from "axios";
import * as https from 'https';
import * as path from 'path';
import * as fs from "fs";

const servers = (process.env.P9_SERVER_URL && process.env.P9_SERVER_TOKEN)
    ? [{url: process.env.P9_SERVER_URL, token: process.env.P9_SERVER_TOKEN}]
    : JSON.parse(`[]`);

const agent = new https.Agent({
    rejectUnauthorized: false
});

const packageRelationsAndEntityType: {
    name: string;
    entity: string;
    entityName?: string;
    relations?: string[];
    dependencies?: string[];
}[] = [
    { name: 'role', entity: 'role', entityName: 'Role' },
    { name: 'wf_notifications', entity: 'wf_notifications', entityName: 'Email Template' },
    { name: 'certificates', entity: 'certificates', entityName: 'Certificates' },
    { name: 'odataMock', entity: 'odata_mockdata', entityName: 'oDataMock' },
    { name: 'theme', entity: 'theme', entityName: 'Theme' },
    { name: 'pdf', entity: 'pdf', entityName: 'PDF' },
    { name: 'doc', entity: 'doc', entityName: 'Documentation' },
    { name: 'jsscript_group', entity: 'jsscript_group', entityName: 'Script Project' },
    { name: 'script_scheduler', entity: 'script_scheduler', entityName: 'Script' },
    { name: 'wf_definition', entity: 'wf_definition', entityName: 'Workflow' },
    {
        name: 'api_authentication',
        entity: 'api_authentication',
        entityName: 'API Authentication',
    },
    { name: 'systems', entity: 'systems', entityName: 'Remote Systems' },

    { name: 'api_group', entity: 'api_group', entityName: 'API Group' },
    { name: 'api', entity: 'api', entityName: 'API', relations: ['roles'] },
    { name: 'jsclass', entity: 'jsscript', entityName: 'Script' },
    { name: 'odataSource', entity: 'odata_source', entityName: 'oDataSource' },

    {
        name: 'rulesengine',
        entity: 'rulesengine',
        entityName: 'Rules Engine',
        relations: ['roles'],
    },
    { name: 'department', entity: 'department', entityName: 'Group', relations: ['roles'] },
    { name: 'tile', entity: 'tile', entityName: 'Tile', relations: ['roles'] },
    {
        name: 'dictionary',
        entity: 'dictionary',
        entityName: 'Table',
        relations: ['rolesRead', 'rolesWrite'],
    },
    {
        name: 'apps',
        entity: 'app_runtime',
        entityName: 'Application',
        relations: ['apis'],
    },
    {
        name: 'category',
        entity: 'category',
        entityName: 'Tile Group',
        relations: ['roles', 'tiles'],
    },
    { name: 'launchpad', entity: 'launchpad', entityName: 'Launchpad', relations: ['cat'] },
    {
        name: 'reports',
        entity: 'reports',
        entityName: 'Adaptive Framework',
        relations: ['roles', 'scriptSelObj', 'scriptRunObj', 'tableObj'],
    },
];

const artifactsPath = path.join(process.cwd(), 'artifacts');

async function readFile(
    path: fs.PathLike,
    options?: { encoding?: BufferEncoding; flag?: string } | BufferEncoding,
): Promise<string | Buffer> {
    return new Promise((resolve, reject) => {
        fs.readFile(path, options, (err, data) => {
            err ? reject(err) : resolve(data);
        });
    });
}

async function readPackageFile() {
    const content = await readFile(path.join(artifactsPath, 'dev_package.json'), 'utf-8') as string;
    return JSON.parse(content);
}

async function deployPackageFile(devPackage, url, token) {
    try {
        await axios.post(`${url}/api/functions/Package/SaveDeployPackage`, devPackage, {
            httpsAgent: agent,
            headers: {
                'Authorization': `Bearer ${token}`,
            }
        });
    } catch (e) {
        console.log(`Error sending development package to: ${url}`, e);
    }
}

(async () => {
    try {
        const devPackage = await readPackageFile();

        for (let i = 0; i < packageRelationsAndEntityType.length; i++) {

            const artifactType = packageRelationsAndEntityType[i];
            const artifacts = devPackage[artifactType.name];

            if (!artifacts?.length) continue;

            const artifactTypePath = path.join(artifactsPath, artifactType.entityName);
            for (let y = 0; y < artifacts.length; y++) {
                const artifact = artifacts[y]
                const filename = `${artifact.name || artifact.title || artifact.application}-${artifact.id}`;
                devPackage[artifactType.name][y] = JSON.parse(await readFile(path.join(artifactTypePath, filename) + '.json', 'utf-8') as string);
            }
        }

        for (let i = 0; i < servers.length; i++) {
            await deployPackageFile(devPackage, servers[i].url, servers[i].token);
        }
        console.log('Package has been deployed');
    } catch (e) {
        console.log('Failed to deploy package', e);
    }
    process.exit(0);
})();
