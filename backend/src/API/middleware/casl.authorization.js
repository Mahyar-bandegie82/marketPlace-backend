import createError from 'http-errors';
import { prismaPool } from '../../helper/helper.js';
import { defineAbilityFor } from '../../permissions/defineAbility.js';
import { ForbiddenError } from '@casl/ability';

// Fetch user roles and attach CASL ability instance to the request
export async function attachAbility(req, res, next) {
    if (req.id === undefined) {
        req.user = null;
        req.ability = defineAbilityFor(null);
        return next();
    }

    const user = await prismaPool.user.findUnique({
        where: { id: req.id },
        select: {
            id: true,
            admin:  { select: { id: true } },
            client: { select: { id: true } },
            seller: { select: { id: true, verified: true } },
        },
    });
    // console.log(user);
    if (!user) next(createError(401, 'User not found'));

    req.user = user;
    req.ability = defineAbilityFor(user);
    next();
}

// Middleware generator to enforce CASL authorization rule on specified action and subject
export const authorize = (action, subjectType) => (req, res, next) => {
    ForbiddenError.from(req.ability).throwUnlessCan(action, subjectType);
    next();
};
