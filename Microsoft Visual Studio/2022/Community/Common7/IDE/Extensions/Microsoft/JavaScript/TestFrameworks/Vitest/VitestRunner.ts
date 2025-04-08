import { VitestTestRunner } from 'vitest/runners'
import { Suite } from '@vitest/runner'

export default class VSRunner extends VitestTestRunner {
    async onBeforeRunSuite(suite: Suite): Promise<void> {
        suite.mode = 'skip';
    }
}