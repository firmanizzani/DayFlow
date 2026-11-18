package com.dayflow.category;

import static com.dayflow.common.Input.*;

import com.dayflow.common.*;
import com.fasterxml.jackson.databind.JsonNode;
import java.util.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
public class CategoryService {
  private final CategoryRepository categories;

  public CategoryService(CategoryRepository categories) {
    this.categories = categories;
  }

  public List<Category> list(Long user) {
    return categories.findAllByUserId(user);
  }

  public Category save(Long user, Long id, JsonNode n) {
    var c =
        id == null
            ? new Category()
            : categories.findByIdAndUserId(id, user).orElseThrow(ApiException::missing);
    c.userId = user;
    if (id == null || n.has("name")) c.name = text(n, "name", 100);
    if (id == null || n.has("color")) {
      c.color = text(n, "color", 7);
      if (!c.color.matches("#[0-9a-fA-F]{6}"))
        throw ApiException.invalid("Color must be a six-digit hex color.");
    }
    return categories.save(c);
  }

  public void delete(Long user, Long id) {
    categories.delete(categories.findByIdAndUserId(id, user).orElseThrow(ApiException::missing));
  }
}
