synchronized int detectCollision(Oval o) throws InterruptedException {
        int direction = o.direction;
        boolean trackedRect = false;
        for (int j = 0; j < rectangles.size(); j++) {
            MyRectangle temp_rect = rectangles.get(j);
            Point p = o.intersects(temp_rect);
            if (p != null && !trackedRect) {
                if (p.x == 0 && p.y == 0) {
                    if (o.direction <= 180) {
                        direction = o.direction + 180 + (int) (Math.random() * 40) - 20;
                    } else {
                        direction = o.direction - 180 + (int) (Math.random() * 40) - 20;
                    }
                }
                if (p.x == temp_rect.x + temp_rect.width / 2) {
                    if (p.y == temp_rect.y) {
                        if (o.direction < 90) {
                            direction = 180 - o.direction;
                        }
                        if (o.direction > 270) {
                            direction = 270 - (o.direction - 270);
                        }
                    }
                    if (p.y == temp_rect.y + temp_rect.heigth) {
                        if (o.direction <= 180) {
                            direction = (180 - o.direction);
                        }
                        if (o.direction >= 180) {
                            direction = 360 - (o.direction - 180);
                        }
                    }
                } else if (p.y == temp_rect.y + temp_rect.heigth / 2) {
                    if (p.x == temp_rect.x) {
                        direction = 360 - o.direction;
                    }
                    if (p.x == temp_rect.x + temp_rect.width) {
                        direction = 360 - o.direction;
                    }
                }
                trackedRect = true;
                if (temp_rect.direction != -2) {
                    temp_rect.remove = true;
                }
            } else if (p != null) {
                temp_rect.first = true;
            }

        }
        if (o.x <= 0 && direction >= 180) {
            if (direction == 360) {
                direction /= 2;
            }
            direction = 360 - direction;
        }
        if (o.x >= 971 && direction <= 180) {
            if (direction == 180) {
                direction *= 2;
            }
            direction = 360 - direction;
            if (direction == 360) {
                direction = 0;
            }
        }
        if (o.y <= 0 && direction >= 90 && direction <= 270) {
            if (direction >= 180) {
                direction = 360 - (direction - 180);
            } else {
                direction = 180 - direction;
            }
            if (direction == 360) {
                direction = 0;
            }
        }
        if (o.y >= 921 && (direction <= 90 || direction >= 270)) {
            if (direction >= 180) {
                direction = 270 - (direction - 270);
            } else {
                direction = 180 - direction;
            }
        }
        if (remCircle && o.y > 850) {
            o.remove = true;
        }
        return direction;
    }