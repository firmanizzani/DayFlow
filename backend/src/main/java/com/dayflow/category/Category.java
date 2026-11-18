package com.dayflow.category;

import com.dayflow.common.OwnedEntity;
import jakarta.persistence.*;
import java.time.*;

@Entity
@Table(name = "categories")
public class Category extends OwnedEntity {
  public String name;
  public String color;
}
