package com.dayflow.security;

import jakarta.servlet.*;
import jakarta.servlet.http.*;
import java.io.IOException;
import java.util.concurrent.ConcurrentHashMap;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

@Component
public class AuthRateLimit extends OncePerRequestFilter {
  private record Window(long start, int count) {}

  private final ConcurrentHashMap<String, Window> windows = new ConcurrentHashMap<>();

  @Override
  protected void doFilterInternal(
      HttpServletRequest req, HttpServletResponse res, FilterChain chain)
      throws ServletException, IOException {
    if (req.getRequestURI().startsWith("/api/v1/auth/") && req.getMethod().equals("POST")) {
      long now = System.currentTimeMillis();
      if (windows.size() > 10000)
        windows.entrySet().removeIf(e -> now - e.getValue().start > 60000);
      var window =
          windows.compute(
              req.getRemoteAddr(),
              (key, old) ->
                  old == null || now - old.start >= 60000
                      ? new Window(now, 1)
                      : new Window(old.start, old.count + 1));
      if (window.count > 30) {
        res.setStatus(429);
        res.setHeader("Retry-After", "60");
        res.setContentType("application/json");
        res.getWriter()
            .write(
                "{\"code\":\"RATE_LIMIT\",\"message\":\"Too many attempts. Try again in a minute.\"}");
        return;
      }
    }
    chain.doFilter(req, res);
  }
}
