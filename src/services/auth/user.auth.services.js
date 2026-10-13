import {PrismaClient} from '@prisma/client'
import {comparePassword, hashPassword} from "../../helper/helper.js";
import crypto from "crypto"


const prisma = new PrismaClient();

async function userExistence(json) {
    try {
        const user = await prisma.user.findUnique({
            where: {phoneNumber: json.phoneNumber, email: json.email}
        })
        if (user) return {error: 'user already exists'};
        return json
    } catch (error) {
        console.log(error)
    }
}

export async function getProfile(id) {
    try {
        const user = await prisma.user.findUnique({
            where : {id : id}
        })
        if (!user) return {error: "user not found"};
        return user
    } catch (error) {
        console.log(error)
        return {error: error.message}
    }
}

export async function signUp(json) {
    try {
        const doesUserExist = await userExistence(json);
        if (doesUserExist.error) {
            throw new Error("User already exists");
        } else {
            const hashedPassword = await hashPassword(json.password);
            return await prisma.user.create({
                data: {
                    userName: json.userName,
                    password: hashedPassword,
                    phoneNumber: json.phoneNumber,
                    email: json.email,
                    refreshToken: json.refreshToken,
                }
            });
        }
    } catch (error) {
        console.error(error)
        return {error: error.message}
    }
}

export async function login(json) {
    try {
        const user = await prisma.user.findUnique({
            where: {phoneNumber: json.phoneNumber},
        })

        if (!user) {
            throw new Error("user does not exist");
        }
        else if ((json.userName !== user.userName) || (!comparePassword(json.password, user.password))){
            throw new Error("invaild username or password")
        }

        return user;
    } catch (error) {
        console.error(error)
        return {error: error.message}
    }
}

export async function addRefreshToken(refreshToken, id) {
    try {
        refreshToken = {
            refreshToken : crypto.createHash('sha256').update(refreshToken).digest('hex'),
            expiresIn: Date.now() + 7 * 24 * 60 * 60 * 1000,
        }
        const output = await prisma.user.update({
            where: {id: id},
            data : {
                refreshToken: {push : refreshToken},
            }
        })
    } catch (error) {
        console.error(error)
        return {error: error.message}
    }
}

export async function changeUserInfo(userId, json){
    try {
        const originalUser = await getProfile(userId);
        const user = prisma.user.update({
            where: {id: userId},
            data : {
                userName: json.userName ?? originalUser.userName,
                phoneNumber: json.phoneNumber ?? originalUser.phoneNumber,
                password: json.password ?? originalUser.password,
                email: json.email ?? originalUser.email
            }
        })

        return user;
    } catch (error) {
        console.error(error)
        return {error: error.message}
    }
}

export async function getRefreshTokenByHash(hash, id) {
    try{
        const user = await getProfile(id);
        if (user.error) return {error: "user not found"};
        const tokens = user.refreshToken;
        const requestedToken = tokens.filter((token) => {
            return token.refreshToken === hash;
        })
        if(!requestedToken) throw new Error("token doesnt exist");
        return requestedToken;
    } catch (error){
        console.error(error)
        return {error: error.message}
    }
}
export async function deleteRefreshToken(hash, id) {
    try {

        const user = await getProfile(id);
        if (user.error) return { error: "user not found" };

        let tokens = user.refreshToken;

        if (typeof tokens === 'string') {
            tokens = JSON.parse(tokens);
        }

        const updatedTokens = tokens.filter((token) => token.refreshToken !== hash);

        if (updatedTokens.length === tokens.length) {
            return { error: "token doesn't exist" };
        }
        await prisma.user.update({
            where: { id: id },
            data: {
                refreshToken: updatedTokens,
            }
        });

        return { success: true, message: "Token deleted successfully" };

    } catch (error) {
        console.error(error);
        return { error: error.message };
    }
}