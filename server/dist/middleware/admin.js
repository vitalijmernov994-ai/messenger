export function adminOnly(req, res, next) {
    if (req.user?.role !== 'admin') {
        res.status(403).json({ error: 'Forbidden: admin only' });
        return;
    }
    next();
}
