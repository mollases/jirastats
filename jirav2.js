const moment = require('moment')
const axios = require('./axios')
const converter = require('json-2-csv')

let jql = `project in ("Premium Operations", Premium) and assignee = 62c70495a152cf97364567be and statusCategory = Done`

const interestingFields = [
  {field: 'Summary'},
  {field: 'IssueType', indexInto: 'name'},
  {field: 'Status', indexInto: 'name'},
  {field: 'Priority', indexInto: 'name'},
  {field: 'Assignee', indexInto: 'displayName'},
  {field: 'Reporter', indexInto: 'displayName'},
  {field: 'Creator', indexInto: 'displayName'},
  {field: 'Created', },
  {field: 'Updated', },
]

const daysOff = [
  moment('2022-01-17', 'YYYY-MM-DD'),
  moment('2022-05-30', 'YYYY-MM-DD'),
  moment('2022-06-20', 'YYYY-MM-DD'),
  moment('2022-07-04', 'YYYY-MM-DD'),
  moment('2022-09-05', 'YYYY-MM-DD'),
  moment('2022-11-24', 'YYYY-MM-DD'),
  moment('2022-11-25', 'YYYY-MM-DD'),
  moment('2022-12-25', 'YYYY-MM-DD'),
  moment('2022-12-26', 'YYYY-MM-DD'),
  moment('2022-12-27', 'YYYY-MM-DD'),
  moment('2022-12-28', 'YYYY-MM-DD'),
  moment('2022-12-29', 'YYYY-MM-DD'),
  moment('2022-12-30', 'YYYY-MM-DD'),
  moment('2022-12-31', 'YYYY-MM-DD'),
  moment('2023-01-01', 'YYYY-MM-DD'),
  moment('2023-01-02', 'YYYY-MM-DD'),
]

// TODO: get more than 50 results

const getStoriesFromFilter = async (filter) => {
  const request = `https://whitepages.atlassian.net/rest/api/2/search?jql=${encodeURIComponent(filter)}`
  return axios
    .get(request)
    .then(res => {
      let queries = []
      for(let i = 0; i < res.data.total; i+= res.data.maxResults){
        queries.push(getStoriesFromSubFilter(filter,i))
      }
      return Promise.all(queries)
    })
    .catch(error => {
      console.error(error)
    })
    .then(arrOfArr => arrOfArr.flat())
}


const getStoriesFromSubFilter = async (filter,startAt) => {
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

// issue key and resolved arent here
const findStory = (issue) => {
  return axios
    .get(`https://whitepages.atlassian.net/rest/api/latest/issue/${issue}`)
    .then(r => {
      const story = { issue }
      const { fields } = r.data

      for (let i = 0; i < interestingFields.length; i++) {
        const key = interestingFields[i].field.toLocaleLowerCase() 
        const indexInto = interestingFields[i].indexInto
        if (fields[key]) {
          if(indexInto){
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
      const inProgress = findInterestingInfo(r.data.values, 'first', { "toString": "In Progress" })
      const done = findInterestingInfo(r.data.values, 'last', { "toString": "Done" })

      const data = {
        firstInProgress: inProgress[0] ? inProgress[0].created : undefined,
        lastDone: done[0] ? done[0].created : undefined,
        completed: done[0] ? true: false
      }

      if(inProgress.length && done.length) {
        data.timeTaken = getBusinessDatesCount(inProgress[0].created, done[0].created)
      } else if (inProgress.length && !done.length) {
        data.timeTaken= getBusinessDatesCount(inProgress[0].created, new Date())
      } else {
        data.timeTaken = -1
      }
      return data
    })
}

const findInterestingInfo = (changeLogValues, firstOrLast, objToFind) => {
  const keysToSearch = Object.keys(objToFind)
  const valueInQuestion = changeLogValues.filter(value => {
    let findAll = value.items.filter(item => {
      return item[keysToSearch[0]] === objToFind[keysToSearch[0]]  
    })
    return findAll.length > 0
  })

  if (!firstOrLast || firstOrLast === 'first') {
    valueInQuestion.sort((a, b) => {
      let aa = moment(a.created)
      let bb = moment(b.created)
      return aa.format('YYYYMMDD') - bb.format('YYYYMMDD')
    })
  } else {
    valueInQuestion.sort((a, b) => {
      let aa = moment(a.created)
      let bb = moment(b.created)
      return bb.format('YYYYMMDD') - aa.format('YYYYMMDD')
    })
  }

  return valueInQuestion.map((v) => {
    return {
      author: v.author.displayName,
      created: v.created,
      toString: v.items[0].toString,
    }
  })
}

const getBusinessDatesCount = (startDate, endDate) => {
  let count = 0;

  let curDate = moment(startDate);
  const end = moment(endDate)
  while (curDate.isBefore(end)) {
    const dayOfWeek = curDate.day();
    const match = daysOff.filter(d => curDate.startOf('date').isSame(d))
    if (dayOfWeek !== 0 && dayOfWeek !== 6 && match.length === 0) {
      count++;
    }
    curDate = curDate.add(1, 'day');
  }
  return count;
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
  return new Promise((resolve,reject) => {
    converter.json2csv(data, (err, csv) => {
      if(err){
        return reject(err)
      }
      resolve(csv)
    })
  })
}

getStoriesFromFilter(jql)
  .then((arr) => {
    const promises = arr.map(issue => {
      return getStoryInfo(issue)
    })
    return Promise.all(promises)
  })
  .then(convertToCSV)
  .then(console.log)