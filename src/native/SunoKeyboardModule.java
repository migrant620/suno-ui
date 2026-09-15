package dev.m620.sunoui.audio;

import android.view.View;
import android.view.ViewTreeObserver;
import android.view.inputmethod.InputMethodManager;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.UIManager;
import com.facebook.react.bridge.UiThreadUtil;
import com.facebook.react.uimanager.UIManagerHelper;
import com.facebook.react.uimanager.IllegalViewOperationException;
import com.facebook.react.views.textinput.ReactEditText;
import java.util.HashMap;
import java.util.Map;

/** Opens the editor's IME once its own dialog window can accept input. */
public final class SunoKeyboardModule extends ReactContextBaseJavaModule {
    private final Map<View, FocusRequest> pending = new HashMap<>();
    private boolean invalidated;

    public SunoKeyboardModule(ReactApplicationContext context) { super(context); }
    @Override public String getName() { return "SunoKeyboard"; }

    @ReactMethod public void focusInWindow(int tag) {
        UiThreadUtil.runOnUiThread(() -> {
            if (invalidated) return;
            UIManager manager = UIManagerHelper.getUIManagerForReactTag(getReactApplicationContext(), tag);
            View target;
            try { target = manager == null ? null : manager.resolveView(tag); }
            catch (IllegalViewOperationException removed) { return; }
            if (!(target instanceof ReactEditText) || !target.isAttachedToWindow()) return;
            FocusRequest old = pending.get(target);
            if (old != null) old.dispose();
            FocusRequest request = new FocusRequest((ReactEditText) target);
            pending.put(target, request);
            request.start();
        });
    }

    private final class FocusRequest implements ViewTreeObserver.OnWindowFocusChangeListener, View.OnAttachStateChangeListener {
        private final ReactEditText editor;
        private final ViewTreeObserver observer;
        private boolean scheduled;
        private final Runnable show = this::showKeyboard;
        private void showKeyboard() {
            boolean ready = editor.isAttachedToWindow() && editor.hasWindowFocus() && editor.isFocused();
            dispose();
            if (ready) {
                InputMethodManager keyboard = editor.getContext().getSystemService(InputMethodManager.class);
                keyboard.showSoftInput(editor, InputMethodManager.SHOW_IMPLICIT);
            }
        }

        FocusRequest(ReactEditText editor) { this.editor = editor; observer = editor.getViewTreeObserver(); }
        void start() {
            observer.addOnWindowFocusChangeListener(this);
            editor.addOnAttachStateChangeListener(this);
            onWindowFocusChanged(editor.hasWindowFocus());
        }
        @Override public void onWindowFocusChanged(boolean focused) {
            if (!focused || scheduled) return;
            scheduled = true;
            editor.requestFocusFromJS();
            // Posting after window focus lets Android establish the input connection first.
            editor.post(show);
        }
        @Override public void onViewAttachedToWindow(View view) {}
        @Override public void onViewDetachedFromWindow(View view) { dispose(); }
        void dispose() {
            editor.removeCallbacks(show);
            if (observer.isAlive()) observer.removeOnWindowFocusChangeListener(this);
            editor.removeOnAttachStateChangeListener(this);
            pending.remove(editor);
        }
    }

    @Override public void invalidate() {
        UiThreadUtil.runOnUiThread(() -> {
            invalidated = true;
            for (FocusRequest request : pending.values().toArray(new FocusRequest[0])) request.dispose();
        });
        super.invalidate();
    }
}
