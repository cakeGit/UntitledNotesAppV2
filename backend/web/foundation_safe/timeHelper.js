
const MS_IN_DAY = 1000 * 60 * 60 * 24;

/**
 * Takes in the due date (integer timestamp from the database), comparing it to the current time
 * Outputs a string in the format of "in X days", "X days ago", "in X months", "X years ago" with an exception for "today"
 * Also returns the styling class to be used
 */
export function getTimeDisplay(dueDate) {
    //Since our units are only in a day, we need to keep it
    // as to avoid due dates within 23 hours always showing as today, even if its the next day
    function toDayOnly(date) {
        return new Date(Math.floor(date / MS_IN_DAY) * MS_IN_DAY);
    }

    const now = toDayOnly(new Date());
    // Get if the date is today
    const due = toDayOnly(new Date(dueDate));
    const deltaDays = Math.round((now - due) / MS_IN_DAY);
    const isToday = deltaDays === 0;

    let prefix = "";
    let suffix = "";

    //Decide the prefix and suffix if this happened before or after
    if (isToday) {
        return ["today", "due_date_today"];
    } else if (due < now) {
        suffix = " ago";
    } else {
        prefix = "in ";
    }

    //Get the difference of days (either forward or back in time but always positive)
    const differenceInDays = Math.abs(deltaDays);

    //Define our results
    let value;
    let unit;

    if (differenceInDays >= 365) {
        //In terms of years
        value = Math.round(differenceInDays / 365);
        unit = value !== 1 ? "years" : "year";
    } else if (differenceInDays >= 30) {
        //In terms of months
        value = Math.round(differenceInDays / 30);
        unit = value !== 1 ? "months" : "month";
    } else {
        //In terms of days
        value = differenceInDays;
        unit = value !== 1 ? "days" : "day";
    }

    //Return an array of the string and style, which can be easily unpacked as seen below.
    return [
        prefix + value + " " + unit + suffix,
        due < now ? "due_date_past" : "due_date_future",
    ];
}
