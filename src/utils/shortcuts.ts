import { t } from 'fyo';
import type { Doc } from 'fyo/model/doc';
import { fyo } from 'src/initFyo';
import router from 'src/router';
import { focusedDocsRef } from './refs';
import { showMessageDialog } from './ui';
import { Shortcuts } from './vueUtils';

export function setGlobalShortcuts(shortcuts: Shortcuts) {
  /**
   * PMod              : if macOS then Meta (⌘) else Ctrl, both Left and Right
   *
   * Backspace         : Go to the previous page
   * PMod + S          : Save or Submit focused doc if possible
   * PMod + Backspace  : Cancel or Delete  focused doc if possible
   */
  shortcuts.set(['Backspace'], async () => {
    if (document.body !== document.activeElement) {
      return;
    }

    router.back();
  });

  shortcuts.pmod.set(['KeyS'], async () => {
    const doc = focusedDocsRef.last();
    if (!doc) {
      return;
    }

    if (doc.canSave) {
      await showDocStateChangeMessageDialog(doc, 'sync');
    } else if (doc.canSubmit) {
      await showDocStateChangeMessageDialog(doc, 'submit');
    }
  });

  shortcuts.pmod.set(['Backspace'], async () => {
    const doc = focusedDocsRef.last();
    if (!doc) {
      return;
    }

    if (doc.canCancel) {
      await showDocStateChangeMessageDialog(doc, 'cancel');
    } else if (doc.canDelete) {
      await showDocStateChangeMessageDialog(doc, 'delete');
    }
  });
}

async function showDocStateChangeMessageDialog(
  doc: Doc,
  state: 'sync' | 'submit' | 'cancel' | 'delete'
) {
  const label = fyo.schemaMap[doc.schemaName]?.label ?? t`Doc`;
  const name = doc.name ?? '';
  const message =
    { sync: t`Save`, submit: t`Submit`, cancel: t`Cancel`, delete: t`Delete` }[
      state
    ] + ` ${label} ${name}`;

  await showMessageDialog({
    message,
    buttons: [
      {
        label: t`Yes`,
        async action() {
          await doc[state]();
        },
      },
      {
        label: t`No`,
        action() {},
      },
    ],
  });
}
