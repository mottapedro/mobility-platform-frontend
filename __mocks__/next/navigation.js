// __mocks__/next/navigation.js
const nextRouter = require('next-router-mock');

module.exports = {
    ...nextRouter,
    useRouter: nextRouter.useRouter,
};
