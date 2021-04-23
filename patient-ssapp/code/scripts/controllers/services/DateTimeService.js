const convertStringToLocaleDate = (dateAsString, locale = 'sw') => {
    return new Date(dateAsString).toLocaleDateString(locale);
}

export default {
    convertStringToLocaleDate
};