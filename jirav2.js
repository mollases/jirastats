const commandLineArgs = require('command-line-args')
const converter = require('json-2-csv')
const axios = require('./axios')
const Analyzer = require('./changelogAnalyzer')
const { interestingFields } = require('./contants')

const optionDefinitions = [
  { name: 'ticket', alias: 't', type: String },
  { name: 'jql', alias: 'j', type: String }
]

const options = commandLineArgs(optionDefinitions)


let jql = `project = PREMOP AND status = Done AND labels = CRO AND type not in ( Sub-Task , Bug)`

/*
TODO:
estimations
"what happens when you work two tickets at once"
*/

const getStoriesFromFilter = async (filter) => {
  const request = `https://whitepages.atlassian.net/rest/api/2/search?jql=${encodeURIComponent(filter)}`
  return axios
    .get(request)
    .then(res => {
      let queries = []
      for (let i = 0; i < res.data.total; i += res.data.maxResults) {
        queries.push(getStoriesFromSubFilter(filter, i))
      }
      return Promise.all(queries)
    })
    .catch(error => {
      console.error(error)
    })
    .then(arrOfArr => arrOfArr.flat())
}

const getStoriesFromSubFilter = async (filter, startAt) => {
  const request = `https://whitepages.atlassian.net/rest/api/2/search?jql=${encodeURIComponent(filter)}&startAt=${startAt}`

  return axios
    .get(request)
    .then(res => {
      const stories = res.data.issues.map((k) => {
        return k.key
      });
      return stories
    })
    .catch(error => {
      console.error(error);
    });
}

const findStory = (issue) => {
  return axios
    .get(`https://whitepages.atlassian.net/rest/api/latest/issue/${issue}`)
    .then(r => {
      const story = { issue }
      const { fields } = r.data

      for (let i = 0; i < interestingFields.length; i++) {
        const key = interestingFields[i].field.toLowerCase()
        const indexInto = interestingFields[i].indexInto
        if (fields[key]) {
          if (indexInto) {
            story[key] = fields[key][indexInto]
          } else {
            story[key] = fields[key]
          }
        }
      }
      return story
    })
}

const getStoryHistory = (issue) => {
  return axios
    .get(`https://whitepages.atlassian.net/rest/api/latest/issue/${issue}/changelog`)
    .then(r => {
      const analyzer = new Analyzer(r.data.values)
      return analyzer.getInfo()
    })
}

const getStoryInfo = (story) => {
  return Promise.all([findStory(story), getStoryHistory(story)])
    .then(arr => {
      return {
        ...arr[0],
        ...arr[1]
      }
    })
}

const convertToCSV = async (data) => {
  return new Promise((resolve, reject) => {
    converter.json2csv(data, (err, csv) => {
      if (err) {
        return reject(err)
      }
      resolve(csv)
    })
  })
}

if (options.ticket) {
  getStoryInfo(options.ticket).then(console.log)
} else if (options.jql) {
  getStoriesFromFilter(options.jql)
    .then((arr) => {
      const promises = arr.map(issue => {
        return getStoryInfo(issue)
      })
      return Promise.all(promises)
    })
    .then(convertToCSV)
    .then(console.log)
} else {
  console.log(`

Missing arguments

provide a ticket via "-t {jira ticket}" or "--ticket {jira ticket}"
provide a jql query via "-j "{jql query}" or "--jql "{jql query}"

If you are using the git repo, use this format "npm start -- [args]"
for example "npm start -- -t PREM-1"

`)
}