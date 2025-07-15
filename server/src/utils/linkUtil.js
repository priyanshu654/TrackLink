//Example userAgent

const getDeviceInfo=(userAgent)=>{
    const isMobile=/mobile/i.test(userAgent);
    const browser=userAgent.match(/(chrome|Firefox | Safari| Edge | opera)/i)?.[0] || "Unknown"

    return{
        isMobile,
        browser
    };
};

module.exports={getDeviceInfo};