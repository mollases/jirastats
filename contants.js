const moment = require('moment')

const daysOff = [
    '2022-01-17',
    '2022-05-30',
    '2022-06-20',
    '2022-07-04',
    '2022-09-05',
    '2022-11-24',
    '2022-11-25',
    '2022-12-25',
    '2022-12-26',
    '2022-12-27',
    '2022-12-28',
    '2022-12-29',
    '2022-12-30',
    '2022-12-31',
    '2023-01-01',
    '2023-01-02',
].map(date => moment(date, 'YYY-MM-DD'))

const interestingFields = [
    { field: 'Summary' },
    { field: 'IssueType', indexInto: 'name' },
    { field: 'Status', indexInto: 'name' },
    { field: 'Priority', indexInto: 'name' },
    { field: 'Assignee', indexInto: 'displayName' },
    { field: 'Reporter', indexInto: 'displayName' },
    { field: 'Creator', indexInto: 'displayName' },
    { field: 'Created', },
    { field: 'Updated', },
]

module.exports = {
    daysOff, interestingFields
}