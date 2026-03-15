export const cleanPhoneNumber = (number) => {
    if (!number) return '';
    // Remove all non-numeric characters except +
    return number.replace(/[^\d+]/g, '');
};
