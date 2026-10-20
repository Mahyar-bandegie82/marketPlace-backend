// middlewares/auth/ability.middleware.js
import createError from 'http-errors';
import {prisma} from '../../helper/helper.js';
import { defineAbilityFor } from '../../permissions/defineAbility.js';

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
    if (!user) throw createError(401, 'User not found');

    req.user = user;
    req.ability = defineAbilityFor(user);
    next();
}