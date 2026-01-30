import { buildUrl } from '@corentinth/chisels';
import { isEmpty } from 'lodash-es';

export { createNoteUrl, createNoteUrlHashFragment, parseNoteUrl, parseNoteUrlHashFragment };

const PASSWORD_PROTECTED_HASH_FRAGMENT = 'pw';
const DELETED_AFTER_READING_HASH_FRAGMENT = 'dar';

function createNoteUrlHashFragment({ encryptionKey, isPasswordProtected, isDeletedAfterReading }: { encryptionKey: string; isPasswordProtected?: boolean; isDeletedAfterReading?: boolean }) {
  // Encryption keys are no longer included in URL hash by default
  // They are stored on the server instead for simplified URLs
  const hashFragment = [
    isPasswordProtected && PASSWORD_PROTECTED_HASH_FRAGMENT,
    isDeletedAfterReading && DELETED_AFTER_READING_HASH_FRAGMENT,
  ].filter(Boolean).join(':');

  return hashFragment;
}

function parseNoteUrlHashFragment({ hashFragment }: { hashFragment: string }) {
  const cleanedHashFragment = hashFragment.replace(/^#/, '');

  // If hash is empty, that's OK now - encryption key comes from server
  if (isEmpty(cleanedHashFragment)) {
    return {
      encryptionKey: undefined,
      isPasswordProtected: false,
      isDeletedAfterReading: false,
    };
  }

  const segments = cleanedHashFragment.split(':');

  // Check if last segment is an encryption key (for backwards compatibility with old URLs)
  const lastSegment = segments[segments.length - 1];
  const isLastSegmentFlag = [PASSWORD_PROTECTED_HASH_FRAGMENT, DELETED_AFTER_READING_HASH_FRAGMENT].includes(lastSegment);

  let encryptionKey: string | undefined;
  let flags = segments;

  if (!isLastSegmentFlag && segments.length > 0) {
    // Last segment is encryption key (backwards compatibility)
    encryptionKey = segments.pop();
    flags = segments;
  }

  const hasInvalidSegments = flags.some(segment => ![PASSWORD_PROTECTED_HASH_FRAGMENT, DELETED_AFTER_READING_HASH_FRAGMENT].includes(segment));

  if (hasInvalidSegments) {
    throw new Error('Invalid hash fragment');
  }

  return {
    encryptionKey,
    isPasswordProtected: flags.includes(PASSWORD_PROTECTED_HASH_FRAGMENT),
    isDeletedAfterReading: flags.includes(DELETED_AFTER_READING_HASH_FRAGMENT),
  };
}

function createNoteUrl({
  noteId,
  encryptionKey,
  clientBaseUrl,
  isPasswordProtected,
  isDeletedAfterReading,
  pathPrefix,
}: {
  noteId: string;
  encryptionKey: string;
  clientBaseUrl: string;
  isPasswordProtected?: boolean;
  isDeletedAfterReading?: boolean;
  pathPrefix?: string;
}): { noteUrl: string } {
  const hashFragment = createNoteUrlHashFragment({ encryptionKey, isPasswordProtected, isDeletedAfterReading });

  const noteUrl = buildUrl({
    path: [pathPrefix, noteId],
    hash: hashFragment,
    baseUrl: clientBaseUrl,
  });

  return { noteUrl };
}

function parseNoteUrl({ noteUrl }: { noteUrl: string }) {
  const url = new URL(noteUrl);

  const noteId = url.pathname.split('/').filter(Boolean).pop();

  if (!noteId) {
    throw new Error('Invalid note url');
  }

  const { encryptionKey, isPasswordProtected, isDeletedAfterReading } = parseNoteUrlHashFragment({ hashFragment: url.hash });

  return { noteId, encryptionKey, isPasswordProtected, isDeletedAfterReading };
}
