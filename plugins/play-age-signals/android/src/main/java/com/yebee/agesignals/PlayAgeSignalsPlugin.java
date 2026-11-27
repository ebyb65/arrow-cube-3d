package com.yebee.agesignals;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.google.android.play.agesignals.AgeSignalsManager;
import com.google.android.play.agesignals.AgeSignalsManagerFactory;
import com.google.android.play.agesignals.AgeSignalsRequest;
import com.google.android.play.agesignals.AgeSignalsResult;
import java.lang.reflect.Field;
import java.lang.reflect.Modifier;

/**
 * Asks Google Play for the player's age signal (Play Age Signals API), as California AB 1043 requires
 * from 1 Jan 2027. The game only uses it to decide whether ads must be child-directed / non-personalized;
 * nothing is stored or sent anywhere by this plugin.
 *
 * check() resolves { ok: true, status, ageLower, ageUpper } where status is the AgeSignalsVerificationStatus
 * name (VERIFIED, DECLARED, SUPERVISED, SUPERVISED_APPROVAL_PENDING, SUPERVISED_APPROVAL_DENIED, UNKNOWN) or
 * null when Play has no signal for this user, and the ages are null when Play gives none.
 * On an API error it resolves { ok: false, error } (never rejects), so the game keeps today's behaviour.
 */
@CapacitorPlugin(name = "PlayAgeSignals")
public class PlayAgeSignalsPlugin extends Plugin {

    @PluginMethod
    public void check(PluginCall call) {
        try {
            AgeSignalsManager manager = AgeSignalsManagerFactory.create(getContext().getApplicationContext());
            manager
                .checkAgeSignals(AgeSignalsRequest.builder().build())
                .addOnSuccessListener(result -> call.resolve(toJs(result)))
                .addOnFailureListener(e -> call.resolve(failure(e)));
        } catch (Throwable t) {
            call.resolve(failure(t));
        }
    }

    private static JSObject toJs(AgeSignalsResult r) {
        JSObject o = new JSObject();
        o.put("ok", true);
        if (r == null) {
            o.put("status", JSObject.NULL);
            o.put("ageLower", JSObject.NULL);
            o.put("ageUpper", JSObject.NULL);
            return o;
        }
        // Object: works whether the library returns an enum, an @IntDef int, Integer or null.
        Object status = r.userStatus();
        Object lower = r.ageLower();
        Object upper = r.ageUpper();
        String name = statusName(status);
        o.put("status", name == null ? JSObject.NULL : name);
        o.put("ageLower", lower instanceof Number ? (Object) ((Number) lower).intValue() : JSObject.NULL);
        o.put("ageUpper", upper instanceof Number ? (Object) ((Number) upper).intValue() : JSObject.NULL);
        return o;
    }

    /** Enum -> its name; int constant -> the matching AgeSignalsVerificationStatus field name. */
    private static String statusName(Object status) {
        if (status == null) return null;
        if (status instanceof Number) {
            int v = ((Number) status).intValue();
            for (String cls : new String[] {
                "com.google.android.play.agesignals.model.AgeSignalsVerificationStatus",
                "com.google.android.play.agesignals.AgeSignalsVerificationStatus"
            }) {
                try {
                    for (Field f : Class.forName(cls).getFields()) {
                        if (Modifier.isStatic(f.getModifiers()) && (f.getType() == int.class || f.getType() == Integer.class)) {
                            Object fv = f.get(null);
                            if (fv instanceof Number && ((Number) fv).intValue() == v) return f.getName();
                        }
                    }
                } catch (Throwable ignored) {
                    // try the next location
                }
            }
            return "CODE_" + v;
        }
        return status.toString();
    }

    private static JSObject failure(Throwable e) {
        JSObject o = new JSObject();
        o.put("ok", false);
        String msg = e == null ? "unknown" : (e.getClass().getSimpleName() + ": " + e.getMessage());
        o.put("error", msg);
        return o;
    }
}
