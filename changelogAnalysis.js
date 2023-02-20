const {daysOff} = require('./contants')
const moment = require('moment')

class Analyzer {
    constructor(changeLog) {
        this.changeLog = changeLog

        const inProgress = this.findInterestingInfo('first', { "toString": "In Progress" })
        const done = this.findInterestingInfo('last', { "toString": "Done" })

        this.firstInProgress = inProgress[0] ? inProgress[0].created : undefined
        this.lastDone = done[0] ? done[0].created : undefined
        this.completed = done[0] ? true : false

        if (inProgress.length && done.length) {
            this.businessDaysToComplete = this.getBusinessDaysBetween(inProgress[0].created, done[0].created)
        } else if (inProgress.length && !done.length) {
            this.businessDaysToComplete = this.getBusinessDaysBetween(inProgress[0].created, new Date())
        } else {
            this.businessDaysToComplete = -1
        }
    }

    findInterestingInfo = (firstOrLast, objToFind) => {
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

    getInfo = () => {
        const {
            firstInProgress,
            lastDone,
            completed,
            businessDaysToComplete,
        } = this

        return {
            firstInProgress,
            lastDone,
            completed,
            businessDaysToComplete
        }
    }
}


module.exports = Analyzer