import fs from 'fs'
import { DomainEventBase, DomainEventBus, OpensLocalClones, RepoId } from 'git-en-boite-core'
import { assertThat, equalTo, hasProperty, defined, promiseThat, rejected } from 'hamjest'
import { dirSync } from 'tmp'
import { stubInterface } from 'ts-sinon'

import { InventoryOfReposOnDisk } from './inventory_of_repos_on_disk'
import { RepoPath } from './repo_path'

describe(InventoryOfReposOnDisk.name, () => {
  describe('creating new repos', () => {
    it('creates a new LocalClone in a directory')
  })

  describe('finding existing repos', () => {
    context('when a folder exists for the repo', () => {
      it('returns a Repo', async () => {
        const basePath = dirSync().name
        const repoId = RepoId.generate()
        const repoPath = RepoPath.for(basePath, repoId)
        const localClones = stubInterface<OpensLocalClones>()
        const domainEvents = stubInterface<DomainEventBus>()
        fs.mkdirSync(repoPath.value, { recursive: true })
        const inventory = new InventoryOfReposOnDisk(basePath, localClones, domainEvents)
        const repo = await inventory.find(repoId)
        assertThat(repo, defined())
        assertThat(repo, hasProperty('repoId', equalTo(repoId)))
      })
    })
    it('fails when the repo does not exist @wip', async () => {
      const basePath = dirSync().name
      const repoId = RepoId.generate()
      const localClones = stubInterface<OpensLocalClones>()
      const domainEvents = stubInterface<DomainEventBus>()
      const inventory = new InventoryOfReposOnDisk(basePath, localClones, domainEvents)
      await promiseThat(inventory.find(repoId), rejected())
    })
  })

  describe('checking if a repo exists', () => {
    it('returns true if a folder exists for the repo')
  })
})
