var GOLF = GOLF || {};

(function($, GOLF) {
    $(function() {
        GOLF.Canvas.init();
        GOLF.Course.init();
        GOLF.Ball.init();
        GOLF.Swing.init();
        GOLF.Game.init();
    });
}(jQuery, GOLF));

GOLF.Canvas = {
    context: null,
    width: 1000,
    height: 700,
    init: function() {
        var canvas = document.createElement("canvas");
        this.context = canvas.getContext("2d");
        canvas.width = this.width;
        canvas.height = this.height;
        document.body.appendChild(canvas);
    },
    getContext: function() {
        return this.context;
    }
};

GOLF.Course = {
    border: {
        north: 0,
        south: 500,
        east: 0,
        west: 800
    },
    init: function() {

    },
    render: function() {
        var context = GOLF.Canvas.getContext();
        context.beginPath();
        context.rect(0, 0, this.border.west, this.border.south);
        context.fillStyle = '#B3DB8C';
        context.fill();
    }
};

GOLF.Ball = {
    radius: 10,
    borderWidth: 1,
    /**
     * speed is non-negative
     */
    speed: 0,
    setSpeed: function (speed) {
        this.speed = speed;
    },
    direction: {
        x: 0,
        y: 0
    },
    setDirection: function (direction) {
        this.direction = direction;
    },
    getRadius: function() {
        return this.radius;
    },
    position: {
        x: 100,
        y: 100
    },
    getPosition: function() {
        return this.position;
    },
    init: function() {

    },
    /**
     * update
     * @param modifier non-negative
     */
    update: function (modifier) {
        if (this.speed > 0) {

            // collision detection, north border
            if ((this.position.y - this.radius - this.borderWidth) <= GOLF.Course.border.north) {
                this.direction.y *= -1;
            }

            // collision detection, south border
            if ((this.position.y + this.radius + this.borderWidth) >= GOLF.Course.border.south) {
                this.direction.y *= -1;
            }

            // collision detection, east border
            if ((this.position.x - this.radius - this.borderWidth) <= GOLF.Course.border.east) {
                this.direction.x *= -1;
            }

            // collision detection, west border
            if ((this.position.x + this.radius + this.borderWidth) >= GOLF.Course.border.west) {
                this.direction.x *= -1;
            }

            this.position.x += (this.direction.x * this.speedFilter(this.speed) * modifier);
            this.position.y += (this.direction.y * this.speedFilter(this.speed) * modifier);
            this.speed -= 0.3;
        } else {
            // reset
            this.speed = 0;
        }

    },
    speedFilter: function (x) {

        var multiplier = 2;
        var boost = 5;
        var filtered = (multiplier * x) + boost;

        if (filtered > 0) {
            return filtered;
        } else {
            return 0;
        }
    },
    render: function() {
        var context = GOLF.Canvas.getContext();
        context.beginPath();
        context.arc(this.position.x, this.position.y, this.radius, 0, 2 * Math.PI, false);
        context.fillStyle = '#F0F0F0';
        context.fill();
        context.lineWidth = this.borderWidth;
        context.strokeStyle = '#D2D6CE';
        context.stroke();
    }
};

GOLF.Swing = {
    // render() will only draw the swing if (isSwinging)
    isSwinging: false,
    cursorPosition: {
        mousedown: {},
        mouseup: {},
        mousemove: {}
    },
    init: function() {
        this.setupEventListeners();
    },
    setupEventListeners: function() {

        var diff;

        $(window).on('mousedown', function (e) {
            var position = {
                x: e.pageX,
                y: e.pageY
            };

            // if the user mousedown'd on the ball
            if (this.isCursorOnBall(position)) {

                this.isSwinging = true;

                // save the mousedown position
                this.cursorPosition.mousedown = position;

                // bind mousemove listener
                $(window).on('mousemove', function(e) {
                    this.cursorPosition.mousemove = {
                        x: e.pageX,
                        y: e.pageY
                    };
                }.bind(this));

                // bind mouseup listener
                $(window).on('mouseup', function (e) {

                    this.isSwinging = false;

                    this.cursorPosition.mouseup = {
                        x: e.pageX,
                        y: e.pageY
                    };

                    // set ball speed and direction

                    // speed is based off of the length of the swing line
                    GOLF.Ball.setSpeed(GOLF.Util.getDistance(GOLF.Ball.getPosition(), this.cursorPosition.mouseup));

                    // direction is the slope of the trajectory
                    GOLF.Ball.setDirection(GOLF.Util.getDirection(GOLF.Util.getAngle(GOLF.Ball.getPosition(), this.cursorPosition.mouseup)));

                    // unbind mousemove
                    $(window).off('mousemove');
                    
                    // unbind mouseup
                    $(window).off('mouseup');

                }.bind(this));
            } else {
                this.isSwinging = false;
            }
        }.bind(this));


    },
    render: function () {
        if (this.isSwinging) {
            // draw it
            var context = GOLF.Canvas.getContext();
            var ballPosition = GOLF.Ball.getPosition();
            context.beginPath();
            context.moveTo(ballPosition.x, ballPosition.y);
            context.lineTo(this.cursorPosition.mousemove.x, this.cursorPosition.mousemove.y);
            context.lineWidth = 2;
            context.strokeStyle = '#66A5E3';
            context.stroke();
        }
    },
    isCursorOnBall: function (cursor) {
        var cursor = cursor || {x: -1, y: -1};
        var ballPosition = GOLF.Ball.getPosition();
        var ballRadius = GOLF.Ball.getRadius();

        // break it down into 4 boundary cases
        
        // is it too far left?
        if (cursor.x < ballPosition.x) {
            return false;
        }

        // is it too far right?
        if (cursor.x > (ballPosition.x + (2 * ballRadius))) {
            return false;
        }

        // is it too far up?
        if (cursor.y < ballPosition.y) {
            return false;
        }

        // is it too far down?
        if (cursor.y > (ballPosition.y + (2 * ballRadius))) {
            return false;
        }

        // otherwise cursor is on ball
        return true;
    }
};

GOLF.Util = {
    getDistance: function(point1, point2) {
        var xs = 0;
        var ys = 0;

        xs = point2.x - point1.x;
        xs = xs * xs;

        ys = point2.y - point1.y;
        ys = ys * ys;

        return Math.sqrt( xs + ys );
    },
    getAngle: function (point1, point2) {
        var dx = point1.x - point2.x;
        var dy = point1.y - point2.y;
        var theta = Math.atan2(dy, dx);
        return theta;
    },
    getDirection: function (angle) {
        return {
            x: Math.cos(angle),
            y: Math.sin(angle)
        };
    }
}

GOLF.Game = {
    intervalReference: null,
    then: null,
    init: function () {
        this.then = Date.now();
        // Execute as fast as possible
        this.intervalReference = setInterval(this.main.bind(this), 1);
    },
    main: function () {
        var now = Date.now();
        var delta = now - this.then;

        this.update(delta / 1000);
        this.render();
        this.then = now;
    },
    update: function (modifier) {
        GOLF.Ball.update(modifier);
    },
    render: function () {
        GOLF.Course.render();
        GOLF.Ball.render();
        GOLF.Swing.render();
    }
};


