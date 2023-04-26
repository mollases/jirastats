const { daysOff } = require('./constants')
const moment = require('moment')

class Analyzer {
    constructor(changeLog) {
        this.changeLog = changeLog

        const inProgress = this.findDatesFor('first', { toString: "In Progress" })
        const done = this.findDatesFor('last', { toString: "Done" })
        const descriptionChanges = this.findDatesFor('first', { field: 'description' })
        const statusTransitions = this.findDatesFor('first', { field: 'status' })
        const allAssignees = this.findEntriesFor({ field: 'assignee' })
        const assignees = this.calculateAssignees(allAssignees)

        this.firstInProgress = inProgress[0] ? inProgress[0].created : undefined
        this.lastDone = done[0] ? done[0].created : undefined
        this.completed = done[0] ? true : false
        this.statusTransitions = statusTransitions.length
        this.lengthInStatus = this.calculateLengthInStatus(statusTransitions)
        this.descriptionChangesAfterInProgress = this.firstInProgress ? descriptionChanges.filter(v => moment(v.created).isAfter(this.firstInProgress)).length : 0
        this.businessDaysToComplete = -1
        this.assigneesCount = assignees.length
        this.assignees = Array.from(new Set(assignees)).join(", ")

        if (inProgress.length && done.length) {
            this.businessDaysToComplete = this.getBusinessDaysBetween(inProgress[0].created, done[0].created)
        } else if (inProgress.length && !done.length) {
            this.businessDaysToComplete = this.getBusinessDaysBetween(inProgress[0].created, new Date())
        }
    }

    findDatesFor = (firstOrLast, objToFind) => {
        const keysToSearch = Object.keys(objToFind)
        const valueInQuestion = this.changeLog.filter(value => {
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

    findEntriesFor = (objToFind) => {
        const keysToSearch = Object.keys(objToFind)
        return this.changeLog.filter(value => {
            let findAll = value.items.filter(item => {
                return item[keysToSearch[0]] === objToFind[keysToSearch[0]]
            })
            return findAll.length > 0
        })
    }

    calculateAssignees = (assignees) => {
        return assignees.filter((assigneeEntry) => {
            const entries = assigneeEntry.items.filter((item) => {
                return item.to !== null
            })
            return entries.length > 0
        }).map((v) => {
            return v.items
        }).flat().map((v) => {
            return v.toString
        })
    }

    getBusinessDaysBetween = (startDate, endDate) => {
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

    calculateLengthInStatus = (statuses) => {
        const individualStatuses = {}
        for (let i = 0; i < statuses.length; i++) {
            const state = statuses[i]
            const currTime = moment(state.created)
            const nextTimestamp = statuses[i + 1] ? moment(statuses[i + 1].created) : currTime
            if (!individualStatuses[state.toString]) {
                individualStatuses[state.toString] = nextTimestamp.diff(currTime)
            } else {
                individualStatuses[state.toString] += nextTimestamp.diff(currTime)
            }
        }

        const descriptiveStatus = {}
        const keys = Object.keys(individualStatuses)
        for (let i = 0; i < keys.length; i++) {
            descriptiveStatus['Hours in '+keys[i]] = Math.floor(moment.duration(individualStatuses[keys[i]]).asHours())
        }
        return descriptiveStatus
    }

    getInfo = () => {
        const {
            firstInProgress,
            lastDone,
            completed,
            businessDaysToComplete,
            descriptionChangesAfterInProgress,
            statusTransitions,
            assigneesCount,
            assignees,
            lengthInStatus
        } = this
        

        return {
            'First Time in Progress': firstInProgress,
            'Last Time in Done': lastDone,
            completed,
            'Business Days Taken': businessDaysToComplete,
            'Scope Changes After in Progress': descriptionChangesAfterInProgress,
            'Status Changes': statusTransitions,
            'Number of Ticket Assignees': assigneesCount,
            'Unique Assignees': assignees,
            ...lengthInStatus
        }
    }
}


module.exports = Analyzer