const convertStringToLocaleDate = (dateAsString = new Date().toString(), locale = 'sw') => {
    return new Date(dateAsString).toLocaleDateString(locale);
}

const convertStringToLocaleDateTimeString = (dateAsString = new Date().toString(), locale = 'sw') => {
    return new Date(dateAsString).toLocaleString(locale);
}

const getCurrentDate = () => {
    return new Date();
}

const getCurrentDateAsISOString = () => {
    return getCurrentDate().toISOString();
}

export default {
    convertStringToLocaleDate,
    convertStringToLocaleDateTimeString,
    getCurrentDate,
    getCurrentDateAsISOString
};