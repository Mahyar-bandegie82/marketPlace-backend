// middlewares/auth/ability.middleware.js
import createError from 'http-errors';
import {prisma} from '../../helper/helper.js';
import { defineAbilityFor } from '../../permissions/defineAbility.js';
import { ForbiddenError } from '@casl/ability';

export async function attachAbility(req, res, next) {
    // no token was provided -> guest
    if (req.id === undefined) {
        req.user = null;
        req.ability = defineAbilityFor(null);
        return next();
    }

    const user = await prisma.user.findUnique({
        where: { id: req.id },
        select: {
            id: true,
            admin:  { select: { id: true } },
            client: { select: { id: true } },
            seller: { select: { id: true, verified: true } },
        },
    });
    console.log(user);
    if (!user) next(createError(401, 'User not found')) ;

    req.user = user;
    req.ability = defineAbilityFor(user);
    next();
}

export const authorize = (action, subjectType) => (req, res, next) => {
    ForbiddenError.from(req.ability).throwUnlessCan(action, subjectType);
    next();
};