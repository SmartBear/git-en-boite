import fs from 'fs'
import {
  DomainEventBus,
  NoSuchRepo,
  OpensLocalClones,
  RepoAlreadyExists,
  RepoId,
} from 'git-en-boite-core'
import { assertThat, defined, equalTo, hasProperty, promiseThat, rejected } from 'hamjest'
import { wasCalled } from 'hamjest-sinon'
import { dirSync } from 'tmp'
import { stubInterface } from 'ts-sinon'

import { InventoryOfReposOnDisk } from './inventory_of_repos_on_disk'
import { RepoPath } from './repo_path'

describe(InventoryOfReposOnDisk.name, () => {
  describe('creating new repos', () => {
    it('creates a new LocalClone in a directory', async () => {
      const basePath = dirSync().name
      const repoId = RepoId.generate()
      const localClones = stubInterface<OpensLocalClones>()
      const domainEvents = stubInterface<DomainEventBus>()
      const inventory = new InventoryOfReposOnDisk(basePath, localClones, domainEvents)
      await inventory.create(repoId)
      assertThat(localClones.createLocalClone, wasCalled())
    })

    it('returns a Repo', async () => {
      const basePath = dirSync().name
      const repoId = RepoId.generate()
      const localClones = stubInterface<OpensLocalClones>()
      const domainEvents = stubInterface<DomainEventBus>()
      const inventory = new InventoryOfReposOnDisk(basePath, localClones, domainEvents)
      const repo = await inventory.create(repoId)
      assertThat(repo, defined())
      assertThat(repo, hasProperty('repoId', equalTo(repoId)))
    })
    context('when the repo already exists', () => {
      it('returns an error', async () => {
        const basePath = dirSync().name
        const repoId = RepoId.generate()
        const repoPath = RepoPath.for(basePath, repoId)
        const localClones = stubInterface<OpensLocalClones>()
        const domainEvents = stubInterface<DomainEventBus>()
        fs.mkdirSync(repoPath.value, { recursive: true })
        const inventory = new InventoryOfReposOnDisk(basePath, localClones, domainEvents)
        await promiseThat(
          inventory.create(repoId),
          rejected(new RepoAlreadyExists('Repository already exists in the inventory', repoId)),
        )
      })
    })
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

      it('opens a LocalClone', async () => {
        const basePath = dirSync().name
        const repoId = RepoId.generate()
        const repoPath = RepoPath.for(basePath, repoId)
        const localClones = stubInterface<OpensLocalClones>()
        const domainEvents = stubInterface<DomainEventBus>()
        fs.mkdirSync(repoPath.value, { recursive: true })
        const inventory = new InventoryOfReposOnDisk(basePath, localClones, domainEvents)
        await inventory.find(repoId)
        assertThat(localClones.openLocalClone, wasCalled())
      })
    })

    it('fails when the repo does not exist', async () => {
      const basePath = dirSync().name
      const repoId = RepoId.generate()
      const localClones = stubInterface<OpensLocalClones>()
      const domainEvents = stubInterface<DomainEventBus>()
      const inventory = new InventoryOfReposOnDisk(basePath, localClones, domainEvents)
      await promiseThat(
        inventory.find(repoId),
        rejected(new NoSuchRepo('No such repository', repoId)),
      )
    })
  })

  describe('checking if a repo exists', () => {
    it('returns true if a folder exists for the repo')
  })
})
