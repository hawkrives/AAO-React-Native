// @flow

// danger (removed by danger)
const {danger, schedule, markdown, warn, fail} = require('danger')

// danger plugins
const {default: yarn} = require('danger-plugin-yarn')

// utilities
const uniq = require('lodash/uniq')
const findIndex = require('lodash/findIndex')

async function main() {
	const taskName = String(process.env.task)

	switch (taskName) {
		case 'ANDROID':
			await runAndroid()
			break
		case 'IOS':
			await runiOS()
			break
		case 'JS-general':
			await runJSのGeneral()
			await yarn()
			break
		case 'JS-data':
			await runJSのData()
			break
		case 'JS-flow':
			await runJSのFlow()
			break
		case 'JS-jest':
			await runJSのJest()
			break
		case 'JS-lint':
			await runJSのLint()
			break
		case 'JS-prettier':
			await runJSのPrettier()
			break
		case 'JS-yarn-dedupe':
			await runJSのYarnDedupe()
			break
		case 'JS-bundle-android':
		case 'JS-bundle-ios':
			break
		default:
			warn(`Unknown task name "${taskName}"; Danger cannot report anything.`)
	}
}

//
// task=ANDROID
//

async function runAndroid() {
	const logFile = readLogFile('./logs/build').split('\n')
	const buildStatus = readLogFile('./logs/build-status')

	if (buildStatus !== '0') {
		fastlaneBuildLogTail(logFile, 'Android Build Failed')
		// returning early here because if the build fails, there's nothing to analyze
		return
	}

	if (!(await didNativeDependencyChange())) {
		// nothing changed to make this worth analyzing
		return
	}

	// we do not currently do any android analysis
}

//
// task=IOS
//

async function runiOS() {
	const logFile = readLogFile('./logs/build').split('\n')
	const buildStatus = readLogFile('./logs/build-status')

	if (buildStatus !== '0') {
		// returning early here because if the build fails, there's nothing to analyze
		fastlaneBuildLogTail(logFile, 'iOS Build Failed')
		return
	}

	if (!(await didNativeDependencyChange())) {
		// nothing changed to make this worth analyzing
		return
	}

	markdown('## iOS Report')

	// tee the "fastlane" output to a log, and run the analysis script
	// to report back the longest compilation units
	const analysisFile = readFile('./logs/analysis')
	markdown(
		h.details(
			h.summary('Analysis of slow build times (>20s)'),
			m.code({}, analysisFile),
		),
	)
}

//
// task=JS-data
//

async function runJSのData() {
	await runJSのDataのData()
	await runJSのDataのBusData()
}

function runJSのDataのData() {
	const dataValidationLog = readLogFile('./logs/validate-data')

	if (!dataValidationLog) {
		return
	}

	if (!isBadDataValidationLog(dataValidationLog)) {
		return
	}

	fileLog("Something's up with the data.", dataValidationLog)
}

function runJSのDataのBusData() {
	const busDataValidationLog = readLogFile('./logs/validate-bus-data')

	if (!busDataValidationLog) {
		return
	}

	if (!isBadDataValidationLog(busDataValidationLog)) {
		return
	}

	fileLog("🚌 Something's up with the bus routes.", busDataValidationLog)
}

//
// task=JS-general
//

async function runJSのGeneral() {
	await flowAnnotated()
	await bigPr()
	await exclusionaryTests()
	await xcodeproj()
	await changelogSync()
}

// New js files should have `@flow` at the top
function flowAnnotated() {
	danger.git.created_files
		.filter(path => path.endsWith('.js'))
		// except for those in /flow-typed
		.filter(filepath => !filepath.includes('flow-typed'))
		.filter(filepath => !readFile(filepath).includes('@flow'))
		.forEach(file =>
			warn(`<code>${file}</code> has no <code>@flow</code> annotation!`),
		)
}

// Warn if tests have been enabled to the exclusion of all others
function exclusionaryTests() {
	danger.git.created_files
		.filter(filepath => filepath.endsWith('.test.js'))
		.map(filepath => ({filepath, content: readFile(filepath)}))
		.filter(
			({content}) =>
				content.includes('it.only') || content.includes('describe.only'),
		)
		.forEach(({filepath}) =>
			warn(
				`An <code>only</code> was left in ${filepath} – no other tests can run.`,
			),
		)
}

// Warn when PR size is large (mainly for hawken)
function bigPr() {
	const bigPRThreshold = 400 // lines
	const thisPRSize = danger.github.pr.additions + danger.github.pr.deletions
	if (thisPRSize > bigPRThreshold) {
		warn(
			h.details(
				h.summary(
					`Big PR! We like to try and keep PRs under ${bigPRThreshold} lines, and this one was ${thisPRSize} lines.`,
				),
				h.p(
					'If the PR contains multiple logical changes, splitting each change into a separate PR will allow a faster, easier, and more thorough review.',
				),
			),
		)
	}
}

// Remind us to check the xcodeproj, if it's changed
async function xcodeproj() {
	const pbxprojChanged = danger.git.modified_files.find(filepath =>
		filepath.endsWith('project.pbxproj'),
	)

	if (!pbxprojChanged) {
		return
	}

	warn('The Xcode project file changed. Maintainers, double-check the changes!')

	await pbxprojBlankLine()
	await pbxprojLeadingZeros()
	await pbxprojDuplicateLinkingPaths()
}

function changelogSync() {
	const noteworthyFolder = /^(\.circleci|\.github|android|e2e|fastlane|ios|modules|scripts|source)\//gu
	const noteworthyFiles = new Set([
		'.babelrc',
		'.eslintignore',
		'.eslintrc.yaml',
		'.flowconfig',
		'.gitattributes',
		'.gitignore',
		'.prettierignore',
		'.prettierrc.yaml',
		'.rubocop.yml',
		'.travis.yml',
		'babel.config.js',
		'Brewfile',
		'Gemfile',
		'index.js',
	])

	const changedSourceFiles = danger.git.modified_files.filter(
		file => noteworthyFolder.test(file) || noteworthyFiles.has(file),
	)

	if (!changedSourceFiles.length) {
		return
	}

	const changedChangelog = danger.git.modified_files.includes('CHANGELOG.md')

	if (!changedChangelog) {
		message(
			h.details(
				h.summary(
					'This PR modified important files but does not have any changes to the CHANGELOG.',
				),
				h.ul(
					...changedSourceFiles.map(file => h.li(h.code(file))),
				),
			)
		)
	}
}

// Warn about a blank line that Xcode will re-insert if we remove
function pbxprojBlankLine() {
	const pbxprojPath = danger.git.modified_files.find(filepath =>
		filepath.endsWith('project.pbxproj'),
	)
	const pbxproj = readFile(pbxprojPath).split('\n')

	if (pbxproj[7] === '') {
		return
	}

	warn('Line 8 of the .pbxproj must be an empty line to match Xcode')
}

// Warn about numbers that `react-native link` removes leading 0s on
function pbxprojLeadingZeros() {
	const pbxprojPath = danger.git.modified_files.find(filepath =>
		filepath.endsWith('project.pbxproj'),
	)
	const pbxproj = readFile(pbxprojPath).split('\n')

	const numericLineNames = [
		/^\s+LastSwiftUpdateCheck\s/u,
		/^\s+LastUpgradeCheck\s/u,
		/^\s+LastSwiftMigration\s/u,
	]
	const isLineWithoutLeadingZero = line =>
		numericLineNames.some(nline => nline.test(line) && / [^0]\d+;$/u.test(line))

	const numericLinesWithoutLeadingZeros = pbxproj
		.filter(isLineWithoutLeadingZero)
		.map(line => line.trim())

	if (!numericLinesWithoutLeadingZeros.length) {
		return
	}

	warn(
		h.details(
			h.summary('Some lines in the .pbxproj lost their leading 0s.'),
			h.p('Xcode likes to put them back, so we try to keep them around.'),
			h.ul(...numericLinesWithoutLeadingZeros.map(line => h.li(h.code(line)))),
		),
	)
}

// Warn about duplicate entries in the linking paths after a `react-native link`
async function pbxprojDuplicateLinkingPaths() {
	const pbxprojPath = danger.git.modified_files.find(filepath =>
		filepath.endsWith('project.pbxproj'),
	)
	const xcodeproj = await parseXcodeProject(pbxprojPath)

	const buildConfig = xcodeproj.project.objects.XCBuildConfiguration
	const duplicateSearchPaths = Object.entries(buildConfig)
		.filter(([_, val] /*: [string, any]*/) => typeof val === 'object')
		.filter(
			([_, val] /*: [string, any]*/) => val.buildSettings.LIBRARY_SEARCH_PATHS,
		)
		.filter(([_, val] /*: [string, any]*/) => {
			const searchPaths = val.buildSettings.LIBRARY_SEARCH_PATHS
			return uniq(searchPaths).length !== searchPaths.length
		})

	if (!duplicateSearchPaths.length) {
		return
	}

	fail(
		h.details(
			h.summary(
				'Some of the Xcode <code>LIBRARY_SEARCH_PATHS</code> have duplicate entries. Please remove the duplicates. Thanks!',
			),
			h.p(
				'This is easiest to do by editing the project.pbxproj directly, IMHO. These keys all live under the <code>XCBuildConfiguration</code> section.',
			),
			h.ul(...duplicateSearchPaths.map(([key]) => h.li(h.code(key)))),
		),
	)
}

//
// task=JS-flow
//

function runJSのFlow() {
	const flowLog = readLogFile('./logs/flow')

	if (!flowLog) {
		return
	}

	if (flowLog === 'Found 0 errors') {
		return
	}

	fileLog('Flow would like to interject about types…', flowLog)
}

//
// JS-jest
//

function runJSのJest() {
	const jestLog = readLogFile('./logs/jest')

	if (!jestLog) {
		return
	}

	if (!jestLog.includes('FAIL')) {
		return
	}

	const lines = getRelevantLinesJest(jestLog)

	fileLog('Some Jest tests failed. Take a peek?', lines.join('\n'))
}

function getRelevantLinesJest(logContents) {
	const file = logContents.split('\n')

	const startIndex = findIndex(
		file,
		l => l.trim() === 'Summary of all failing tests',
	)
	const endIndex = findIndex(
		file,
		l => l.trim() === 'Ran all test suites.',
		startIndex,
	)

	return file.slice(startIndex + 1, endIndex - 1)
}

//
// JS-lint
//

function runJSのLint() {
	const eslintLog = readLogFile('./logs/eslint')

	if (!eslintLog) {
		return
	}

	fileLog('Eslint had a thing to say!', eslintLog)
}

//
// JS-prettier
//

function runJSのPrettier() {
	const prettierLog = readLogFile('./logs/prettier')

	if (!prettierLog) {
		return
	}

	fileLog('Prettier made some changes', prettierLog, {lang: 'diff'})
}

function runJSのYarnDedupe() {
	const yarnDedupeLog = readLogFile('./logs/yarn-dedupe')

	if (!yarnDedupeLog) {
		return
	}

	fileLog('yarn dedupe made some changes', yarnDedupeLog, {lang: 'diff'})
}

//
// Utilities
//

const fs = require('fs')
const childProcess = require('child_process')
const stripAnsi = require('strip-ansi')
const directoryTree = require('directory-tree')
const xcode = require('xcode')
const util = require('util')

const execFile = util.promisify(childProcess.execFile)

function fastlaneBuildLogTail(log /*: Array<string>*/, message /*: string*/) {
	const n = 150
	const logToPost = log
		.slice(-n)
		.map(stripAnsi)
		.join('\n')

	fail(
		h.details(
			h.summary(message),
			h.p(`Last ${n} lines`),
			m.code({}, logToPost),
		),
	)
}

const h /*: any*/ = new Proxy(
	{},
	{
		get(_, property) {
			return function(...children /*: Array<string>*/) {
				if (!children.length) {
					return `<${property}>`
				}
				return `<${property}>${children.join('\n')}</${property}>`
			}
		},
	},
)

const m = {
	code(attrs /*: Object*/, ...children /*: Array<string>*/) {
		return (
			'\n' +
			'```' +
			(attrs.language || '') +
			'\n' +
			children.join('\n') +
			'\n' +
			'```' +
			'\n'
		)
	},
	json(blob /*: any*/) {
		return m.code({language: 'json'}, JSON.stringify(blob, null, 2))
	},
}

function readFile(filename /*: string*/) {
	try {
		return fs.readFileSync(filename, 'utf-8')
	} catch (err) {
		fail(
			h.details(
				h.summary(`Could not read <code>${filename}</code>`),
				m.json(err),
			),
		)
		return ''
	}
}

function readLogFile(filename /*: string*/) {
	return readFile(filename).trim()
}

// eslint-disable-next-line no-unused-vars
function readJsonLogFile(filename /*: string*/) {
	try {
		return JSON.parse(readFile(filename))
	} catch (err) {
		fail(
			h.details(
				h.summary(`Could not read the log file at <code>${filename}</code>`),
				m.json(err),
			),
		)
		return []
	}
}

function isBadDataValidationLog(log /*: string*/) {
	return log.split('\n').some(l => !l.endsWith('is valid'))
}

function fileLog(
	name /*: string*/,
	log /*: string*/,
	{lang = null} /*: any*/ = {},
) {
	return markdown(
		`## ${name}

${m.code({language: lang}, log)}`,
	)
}

function parseXcodeProject(pbxprojPath /*: string*/) /*: Promise<Object>*/ {
	return new Promise((resolve, reject) => {
		const project = xcode.project(pbxprojPath)
		// I think this can be called twice from .parse, which is an error for a Promise
		let resolved = false
		project.parse((error, data) => {
			if (resolved) {
				return
			}
			resolved = true

			if (error) {
				reject(error)
			}
			resolve(data)
		})
	})
}

// eslint-disable-next-line no-unused-vars
async function listZip(filepath /*: string*/) {
	try {
		const {stdout} = await execFile('unzip', ['-l', filepath])
		const lines = stdout.split('\n')

		const parsed = lines.slice(3, -3).map(line => {
			const length = parseInt(line.slice(0, 9).trim(), 10)
			// const datetime = line.slice(12, 28)
			const filepath = line.slice(30).trim()
			const type = filepath.endsWith('/') ? 'folder' : 'file'
			return {size: length, filepath, type}
		})
		const zipSize = parsed.reduce((sum, current) => current.size + sum, 0)

		return {files: parsed, size: zipSize}
	} catch (err) {
		fail(
			h.details(
				h.summary(`Could not examine the ZIP file at <code>${filepath}</code>`),
				m.json(err),
			),
		)
	}
}

function listDirectory(dirpath /*: string*/) {
	try {
		return fs.readdirSync(dirpath)
	} catch (err) {
		fail(h.details(h.summary(`${h.code(dirpath)} does not exist`), m.json(err)))
		return []
	}
}

// eslint-disable-next-line no-unused-vars
function listDirectoryTree(dirpath /*: string*/) /*: any*/ {
	try {
		const exists = fs.accessSync(dirpath, fs.F_OK)

		if (!exists) {
			fail(
				h.details(
					h.summary(`Could not access <code>${dirpath}</code>`),
					m.code({}, listDirectory(dirpath).join('\n')),
				),
			)
		}

		return directoryTree(dirpath)
	} catch (err) {
		fail(
			h.details(
				h.summary('<code>listDirectoryTree</code> threw an error'),
				m.json(err),
			),
		)
		return {}
	}
}

async function didNativeDependencyChange() /*: Promise<boolean>*/ {
	const diff = await danger.git.JSONDiffForFile('package.json')

	if (!diff.dependencies && !diff.devDependencies) {
		return false
	}

	// If we need to, we can add more heuristics here in the future
	return true
}

//
// Run the file
//
schedule(main)
