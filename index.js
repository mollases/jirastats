// https://whitepages.atlassian.net/rest/api/latest/issue/PREM-4406/changelog


const axios = require('axios');
const testIssue = require('./testdoc.json')
require('dotenv').config()

let config = {
    headers: {
      Authorization: `Basic ${btoa(process.env.EMAIL+":"+process.env.API_KEY)}`,
    }
  }

// const issue = 'PREM-4160'
// const issue = 'PREM-4406'
// const issue = 'PREM-4194'

const issue = process.argv[2]
const instance = axios.create(config)


const getEpicStories = (epicId) => {
    console.log('getting epic details')
    return instance
    .get(`https://whitepages.atlassian.net/rest/api/2/search?jql=${encodeURIComponent(`"Epic Link" = ${epicId}`)}`)
    .then(res => {
      return res.data.issues.map((k) => {
          return {key:k.key}
      });
    })
    .catch(error => {
      console.error(error);
    });
}

const findStory = (issue) => {
    return instance
    .get(`https://whitepages.atlassian.net/rest/api/latest/issue/${issue}`)
}

const getStoryDetails = (story, issue) => {
    console.log("story", story.fields.summary)
    console.log("assignee",story.fields.assignee.displayName)
    console.log("status", story.fields.status.statusCategory.name, story.fields.status.name)
    console.log("estimate", story.fields.timetracking.originalEstimate)
    console.log("comments", story.fields.comment.comments.length)
    instance
        .get(`https://whitepages.atlassian.net/rest/api/latest/issue/${issue}/changelog`)
        .then(r => {
            const inProgress = findInterestingInfo(r.data.values, {"toString": "In Progress"})
            const done = findInterestingInfo(r.data.values, {"toString": "Done"})

            return  {inProgress, done}
        })
        .then(({inProgress, done}) => {
            if(inProgress.length > 0){
                const startDate = new Date(inProgress[0].created)
                let end = Date.now()
                if(done.length > 0){
                    end = new Date(done[0].created)
                }
                console.log("actual days", getBusinessDatesCount(startDate,end))
            } else {
                console.log("actual days", "not started")
            }

        })
        .catch(e => {
            console.error('there was an error fetching an issues changelong', issue, e)
        })
}

findStory(issue)
    .then(r => {
        if(r.data.fields.issuetype.name === 'Epic'){
            return getEpicStories(issue)
                .then((stories) => {
                    stories.forEach((story) => {
                        findStory(story.key)
                        .catch(e => {
                            console.error("error getting child stories",e)
                        })
                    })
                })
                .catch(e => {
                    console.error("error getting child stories",e)
                })
        } else {
            console.log("getting story details", issue)
            getStoryDetails(r.data,issue)
        }
    })
    .catch(error => {
        console.error('error fetching issue details', issue, error)
    })



const findInterestingInfo = (changeLogValues, objToFind) => {
    const keysToSearch = Object.keys(objToFind)
    const valueInQuestion = changeLogValues.filter(value => {
        const itemsInQuestion = value.items[0]
        return itemsInQuestion[keysToSearch[0]] === objToFind[keysToSearch[0]]
    })
    return valueInQuestion.map((v) =>{
        return {
            author: v.author.displayName,
            created: v.created,
            toString:v.items[0].toString,
        }
    })
}

function getBusinessDatesCount(startDate, endDate) {
    let count = 0;
    const curDate = new Date(startDate.getTime());
    while (curDate <= endDate) {
        const dayOfWeek = curDate.getDay();
        if(dayOfWeek !== 0 && dayOfWeek !== 6) count++;
        curDate.setDate(curDate.getDate() + 1);
    }
    return count;
}

