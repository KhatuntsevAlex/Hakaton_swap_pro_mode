// eslint-disable-next-line @typescript-eslint/no-var-requires
const fs = require('fs');

const config = {
    input: './public/locales/',
    output: './src/constants/localization/',
    languagesNamespace: 'languages',
    namespacesNamespace: 'namespaces',
    mainLanguage: 'en',
};

const getLocalesFileName = (namespace) => `locales.${namespace}`;
const getConstantsFileName = (namespace) => `${namespace}.constants`;

const getOutputFileName = (namespace, isLocales) =>
    `${isLocales ? getLocalesFileName(namespace) : getConstantsFileName(namespace)}`;

const getOutputFilePathAndName = (namespace, isLocales) => {
    const name = getOutputFileName(namespace, isLocales);

    return {
        name,
        path: `${config.output}${getOutputFileName(namespace, isLocales)}.ts`,
    };
};

const getOutputEnumName = (namespace, isLocales) =>
    `${namespace
        .split('-')
        .map((name) => `${name[0].toUpperCase()}${name.slice(1)}`)
        .join('')}${isLocales ? 'Locales' : ''}`;

const defaultFieldParser = (field) => `${field.replace('-', '_').toUpperCase()} = '${field}'`;
const localeFieldParser = (keys) => {
    const namespace = keys[0];
    const translationPathKeys = keys.slice(1);
    return `${translationPathKeys
        .join('__')
        .replace('-', '_')
        .toUpperCase()} = '${namespace}:${translationPathKeys.join('.')}'`;
};

const getFileEnumContent = (
    enumName = 'DefaultEnumName',
    fields = ['test'],
    fieldParser = defaultFieldParser,
) => `export enum ${enumName} {
    ${fields.map((field) => fieldParser(field)).join(',\n\t')}
}\n`;

const getIndexFileContent = (filenames) =>
    filenames.reduce((acc, name) => `${acc}export * from './${name}';\n`, '');

const getLocalesFileEnumData = ({
    namespace, fields, fieldParser, isLocales,
}) => {
    const parsedNS = namespace.toLowerCase();
    return {
        ...getOutputFilePathAndName(parsedNS, isLocales),
        content: getFileEnumContent(getOutputEnumName(parsedNS, isLocales), fields, fieldParser),
    };
};

const getIndexFileData = (allCreatedFilenames) => ({
    path: `${config.output}index.ts`,
    content: getIndexFileContent(allCreatedFilenames),
});

const readDir = (path) =>
    new Promise((resolve, reject) => {
        fs.readdir(path, (err, files) => {
            if (err) throw new Error(err);
            else resolve(files);
        });
    });

const readFile = (path, fileName) =>
    new Promise((resolve, reject) => {
        fs.readFile(path + fileName, { encoding: 'utf8', flag: 'r' }, (err, data) => {
            if (err) throw new Error(err);
            else {
                resolve({
                    fileName,
                    data,
                });
            }
        });
    });

const writeFile = ({ path, content }) =>
    new Promise(() => {
        fs.writeFile(path, content, { flag: 'w' }, (err) => {
            if (err) throw new Error(err);
            console.log('File is created successfully.');
        });
    });

const parseDeep = (target, keys = [], names = []) => {
    if (typeof target === 'string') {
        keys.push(names);
    } else {
        Object.keys(target).forEach((key) => {
            parseDeep(target[key], keys, [...names, key]);
        });
    }
    return keys;
};

const getLocalizationFilesPath = (folderNames) =>
    `${config.input}/${
        folderNames.includes(config.mainLanguage) ? config.mainLanguage : folderNames[0]
    }/`;

readDir(config.input).then((folderNames) => {
    if (!folderNames.length) return;

    const localizationFilesPath = getLocalizationFilesPath(folderNames);

    readDir(localizationFilesPath).then((fileNames) => {
        const promises = fileNames.map((fileName) => readFile(localizationFilesPath, fileName));

        Promise.all(promises).then((results) => {
            const { namespaces: localesNamespaces, filenames: localesFileNames } = results.reduce(
                (acc, { fileName, data }) => {
                    const namespace = fileName.replace('.json', '');

                    const { name: localeFileName, ...localeFileData } = getLocalesFileEnumData({
                        namespace,
                        fields: parseDeep(JSON.parse(data), [], [namespace]),
                        fieldParser: localeFieldParser,
                        isLocales: true,
                    });

                    writeFile(localeFileData);

                    acc.namespaces.push(namespace);
                    acc.filenames.push(localeFileName);

                    return acc;
                },
                { namespaces: [], filenames: [] },
            );

            const { name: languagesFileName, ...languagesFileData } = getLocalesFileEnumData({
                namespace: config.languagesNamespace,
                fields: folderNames,
            });

            writeFile(languagesFileData);

            const { name: namespacesFileName, ...namespacesFileData } = getLocalesFileEnumData({
                namespace: config.namespacesNamespace,
                fields: localesNamespaces,
            });

            writeFile(namespacesFileData);

            writeFile(
                getIndexFileData([languagesFileName, namespacesFileName, ...localesFileNames]),
            );
        });
    });
});
