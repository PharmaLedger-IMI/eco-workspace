const convertStringToLocaleDate = (dateAsString = new Date().toString(), locale = 'sw') => {
    return new Date(dateAsString).toLocaleDateString(locale);
}

export default {
    convertStringToLocaleDate
};