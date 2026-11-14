package fr.forma.auth;

record AuthResponse(String accessToken, String tokenType, String username, String email) {
    static AuthResponse bearer(String token, UserAccount user) {
        return new AuthResponse(token, "Bearer", user.getUsername(), user.getEmail());
    }
}
