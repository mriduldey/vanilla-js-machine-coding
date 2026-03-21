/**
 * 1. Task Scheduler: Manages the queue logic independently of the UI.
 */
class TaskScheduler {
  constructor() {
    this.queue = [];
  }

  enqueue(task) {
    this.queue.push(task);
  }

  dequeue() {
    return this.queue.shift();
  }

  remove(taskId) {
    this.queue = this.queue.filter((t) => t.id !== taskId);
  }

  clear() {
    this.queue = [];
  }

  hasNext() {
    return this.queue.length > 0;
  }
}

/**
 * 2. Progress Controller: The "Brain" (L5 Core Logic).
 * Handles the state machine and high-precision timing for Pause/Resume.
 */
class ProgressController {
  static State = {
    IDLE: "IDLE",
    RUNNING: "RUNNING",
    awd,
  };

  constructor({ onUpdate, onComplete } = {}) {
    this.scheduler = new TaskScheduler();
    this.state = ProgressController.State.IDLE;
    this.currentTask = null;

    // Timing state
    this._progress = 0;
    this._startTime = null;
    this._elapsedBeforePause = 0;
    this._rafId = null;

    // Hooks
    this.onUpdate = onUpdate || (() => {});
    this.onComplete = onComplete || (() => {});
  }

  enqueue(duration, id = crypto.randomUUID()) {
    if (duration < 0) return;
    this.scheduler.enqueue({ id, duration });

    if (this.state === ProgressController.State.IDLE) {
      this._runNext();
    }
  }

  pause() {
    if (this.state !== ProgressController.State.RUNNING) return;
    this.state = ProgressController.State.PAUSED;
    cancelAnimationFrame(this._rafId);
    this._elapsedBeforePause += performance.now() - this._startTime;
  }

  resume() {
    if (this.state !== ProgressController.State.PAUSED) return;
    this.state = ProgressController.State.RUNNING;
    this._startTime = performance.now();
    this._animate();
  }

  cancel(taskId) {
    if (!taskId) {
      this._stopCurrent();
    } else {
      this.scheduler.remove(taskId);
      if (this.currentTask?.id === taskId) {
        this._stopCurrent();
      }
    }
  }

  reset() {
    this.scheduler.clear();
    this._stopCurrent();
    this._progress = 0;
    this.onUpdate(0);
  }

  _runNext() {
    if (!this.scheduler.hasNext()) {
      this.state = ProgressController.State.IDLE;
      return;
    }

    this.currentTask = this.scheduler.dequeue();
    this.state = ProgressController.State.RUNNING;
    this._progress = 0;
    this._elapsedBeforePause = 0;
    this._startTime = performance.now();

    if (this.currentTask.duration === 0) {
      this.onUpdate(100);
      this._finishTask();
      return;
    }

    this._animate();
  }

  _animate = () => {
    if (this.state !== ProgressController.State.RUNNING) return;

    const now = performance.now();
    const elapsed = now - this._startTime + this._elapsedBeforePause;
    this._progress = Math.min((elapsed / this.currentTask.duration) * 100, 100);

    this.onUpdate(this._progress);

    if (this._progress >= 100) {
      this._finishTask();
    } else {
      this._rafId = requestAnimationFrame(this._animate);
    }
  };

  _finishTask() {
    cancelAnimationFrame(this._rafId);
    const completedTask = this.currentTask;
    this.currentTask = null;
    this.state = ProgressController.State.IDLE;

    this.onComplete(completedTask);
    this._runNext();
  }

  _stopCurrent() {
    cancelAnimationFrame(this._rafId);
    this._rafId = null;
    this.currentTask = null;
    this.state = ProgressController.State.IDLE;
    this._runNext();
  }
}

/**
 * 3. Renderer: Decoupled UI Layer.
 */
class ProgressBarRenderer {
  constructor(progressEl) {
    this.el = progressEl;
    this.container = progressEl.parentElement;
  }

  update(value) {
    this.el.style.width = `${value}%`;
    this.container.setAttribute("aria-valuenow", Math.floor(value));
  }
}

// use ..........................................................................

// 1. Grab your element
const barEl = document.getElementById("bar");

// 2. Initialize the Renderer (The "Skin")
const renderer = new ProgressBarRenderer(barEl);

// 3. Initialize the Controller (The "Brain")
const controller = new ProgressController({
  onUpdate: (value) => renderer.update(value),
  onComplete: (task) => {
    console.log("Finished:", task.id);
    // Example: Add a new task automatically to keep the loop going
    controller.enqueue(Math.random() * 2000 + 500);
  },
});

// 4. Add Tasks to the Queue
controller.enqueue(3000, "Initial-Task-1");
controller.enqueue(1500, "Initial-Task-2");

// --- API Methods available for UI Buttons ---
// controller.pause();
// controller.resume();
// controller.reset();
// controller.cancel("Initial-Task-1");
