async function makeAdmin(userId) {
    const user = await prisma.admin.create({
        data: {userId : userId}
    })
    if (!user) {throw createError(400, 'somthing went wrong.');}
    return user;
}

await makeAdmin(2)