const roundWithNSigns = (value, n) => {
    return Math.round(Number(value) * Math.pow(10, n)) / Math.pow(10, n);
};

export { roundWithNSigns as default };
