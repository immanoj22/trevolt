// import package
import moment from 'moment';

import { isEmpty } from "./isEmpty";


export const dateTimeFormat = (dateTime, format = 'YYYY-MM-DD HH:mm:ss') => {
    try {
        if (!isEmpty(dateTime)) {
            let newDateTime = new Date(dateTime);
            if (format.includes('YYYY')) {
                format = format.replace('YYYY', newDateTime.getFullYear())
            }

            if (format.includes('MM')) {
                let month = newDateTime.getMonth() + 1;
                month = month > 9 ? month : `0${month}`
                format = format.replace('MM', month)
            }

            if (format.includes('DD')) {
                let date = newDateTime.getDate();
                date = date > 9 ? date : `0${date}`
                format = format.replace('DD', date)
            }

            if (format.includes('HH')) {
                let hour = newDateTime.getHours();
                hour = hour > 9 ? hour : `0${hour}`
                format = format.replace('HH', hour)
            }

            if (format.includes('mm')) {
                let minute = newDateTime.getMinutes();
                minute = minute > 9 ? minute : `0${minute}`
                format = format.replace('mm', minute)
            }
            return format

        } else {
            return ''
        }
    } catch (err) {
        console.log(err, "dateTimeFormat__err")
        return ''
    }
}

export const momentFormat = (dateTime, format = 'DD-MM-YYYY HH:mm:ss') => {
    try {
        if (!isEmpty(dateTime)) {
            let newDateTime = new Date(dateTime);
            return moment(newDateTime).format(format)
        }
        return ''
    } catch (err) {
        console.log(err, 'momentFormat__err')
        return ''
    }
}

export const generateYearDateRange = (year) => {
    try {
        // Method 1: December 31st at 00:00:00
        const endOfYear = new Date(year, 11, 31);

        // Method 2: One millisecond before January 1st of the next year
        const startOfYear = new Date(year, 0, 1);
        // startOfYear = new Date(startOfYear.getTime() - 1); // Subtract 1 millisecond

        return { startDate: startOfYear, endDate: endOfYear }
    } catch (err) {
        console.log(err, "generateDate__err")
    }
}


export const getPastyear = (count) => {
    try {
        const currentDate = new Date();
        const currentYear = currentDate.getFullYear();
        let pastYears = [currentYear]
        for (let i = 1; i < count; i++) {
            const previousYear = currentYear - i;
            pastYears.push(previousYear)
        }
        return pastYears
    } catch (err) {
        console.log(err)
    }
}

export const getDateDifference = (startDate, endDate) => {
    const diffMs = new Date(endDate) - new Date(startDate); // difference in ms

    const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diffMs / (1000 * 60 * 60)) % 24);
    const minutes = Math.floor((diffMs / (1000 * 60)) % 60);

    return `${days}d : ${hours}hrs : ${minutes}min`;
}